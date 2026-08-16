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
