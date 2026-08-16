import {
  invoke,
} from "@tauri-apps/api/core";

import type {
  ProjectBrowserSnapshot,
} from "./projectBrowserTypes";

export async function browseProjectFiles(
  projectId:
    string,
): Promise<ProjectBrowserSnapshot> {
  return invoke<ProjectBrowserSnapshot>(
    "browse_project_files",
    {
      projectId,
    },
  );
}

export async function readProjectTextFile(
  path:
    string,
): Promise<string> {
  return invoke<string>(
    "read_project_text_file",
    {
      path,
    },
  );
}
