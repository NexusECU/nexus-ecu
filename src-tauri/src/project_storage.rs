use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDiskWriteResult {
    pub project_directory: String,
    pub manifest_path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDiskBackupResult {
    pub file_path: String,
    pub file_name: String,
    pub size_bytes: usize,
    pub sha256: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectBrowserEntry {
    pub entry_type: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectBrowserSnapshot {
    pub project_directory: String,
    pub entries: Vec<ProjectBrowserEntry>,
}

fn safe_component(input: &str) -> String {
    let value: String = input
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect();

    if value.is_empty() {
        "unnamed".to_string()
    } else {
        value
    }
}

fn project_root(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    Ok(base.join("Projects"))
}

fn project_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(project_root(app)?.join(safe_component(project_id)))
}

fn modified_string(metadata: &fs::Metadata) -> String {
    metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|| "0".to_string())
}

fn push_file(
    entries: &mut Vec<ProjectBrowserEntry>,
    path: PathBuf,
    entry_type: &str,
) {
    if let Ok(metadata) = fs::metadata(&path) {
        if metadata.is_file() {
            entries.push(ProjectBrowserEntry {
                entry_type: entry_type.to_string(),
                name: path
                    .file_name()
                    .map(|value| value.to_string_lossy().to_string())
                    .unwrap_or_else(|| "unknown".to_string()),
                path: path.to_string_lossy().to_string(),
                size_bytes: metadata.len(),
                modified_at: modified_string(&metadata),
            });
        }
    }
}

#[tauri::command]
pub fn get_project_storage_root(app: AppHandle) -> Result<String, String> {
    let root = project_root(&app)?;
    fs::create_dir_all(&root).map_err(|error| error.to_string())?;

    Ok(root.to_string_lossy().to_string())
}

#[tauri::command]
pub fn write_project_manifest(
    app: AppHandle,
    project_id: String,
    manifest_json: String,
) -> Result<ProjectDiskWriteResult, String> {
    let dir = project_dir(&app, &project_id)?;

    fs::create_dir_all(dir.join("restore-points"))
        .map_err(|error| error.to_string())?;

    fs::create_dir_all(dir.join("rom-backups"))
        .map_err(|error| error.to_string())?;

    let manifest_path = dir.join("manifest.json");

    fs::write(&manifest_path, manifest_json.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok(ProjectDiskWriteResult {
        project_directory: dir.to_string_lossy().to_string(),
        manifest_path: manifest_path.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn write_project_restore_point(
    app: AppHandle,
    project_id: String,
    label: String,
    session_json: String,
) -> Result<String, String> {
    let dir = project_dir(&app, &project_id)?.join("restore-points");

    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    let file_name = format!("{}.json", safe_component(&label));
    let path = dir.join(file_name);

    fs::write(&path, session_json.as_bytes())
        .map_err(|error| error.to_string())?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn write_project_rom_backup(
    app: AppHandle,
    project_id: String,
    file_name: String,
    bytes: Vec<u8>,
) -> Result<ProjectDiskBackupResult, String> {
    let dir = project_dir(&app, &project_id)?.join("rom-backups");

    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    let safe_name = safe_component(&file_name);
    let path = dir.join(&safe_name);

    fs::write(&path, &bytes).map_err(|error| error.to_string())?;

    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let sha256 = format!("{:x}", hasher.finalize());

    Ok(ProjectDiskBackupResult {
        file_path: path.to_string_lossy().to_string(),
        file_name: safe_name,
        size_bytes: bytes.len(),
        sha256,
    })
}

#[tauri::command]
pub fn browse_project_files(
    app: AppHandle,
    project_id: String,
) -> Result<ProjectBrowserSnapshot, String> {
    let dir = project_dir(&app, &project_id)?;
    let mut entries = Vec::new();

    push_file(
        &mut entries,
        dir.join("manifest.json"),
        "manifest",
    );

    let restore_dir = dir.join("restore-points");
    if restore_dir.exists() {
        for item in fs::read_dir(&restore_dir).map_err(|error| error.to_string())? {
            if let Ok(item) = item {
                push_file(
                    &mut entries,
                    item.path(),
                    "restore-point",
                );
            }
        }
    }

    let backup_dir = dir.join("rom-backups");
    if backup_dir.exists() {
        for item in fs::read_dir(&backup_dir).map_err(|error| error.to_string())? {
            if let Ok(item) = item {
                push_file(
                    &mut entries,
                    item.path(),
                    "rom-backup",
                );
            }
        }
    }

    entries.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(ProjectBrowserSnapshot {
        project_directory: dir.to_string_lossy().to_string(),
        entries,
    })
}

#[tauri::command]
pub fn read_project_text_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);

    match path.extension().and_then(|value| value.to_str()) {
        Some("json") => {}
        _ => {
            return Err(
                "Only JSON project metadata/restore files can be previewed as text."
                    .to_string(),
            )
        }
    }

    fs::read_to_string(path).map_err(|error| error.to_string())
}
