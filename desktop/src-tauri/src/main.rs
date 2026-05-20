#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::{Manager, State};

#[derive(Default)]
struct RecentFiles(std::sync::Mutex<Vec<String>>);

#[derive(Serialize)]
struct OpenFileResult {
    path: String,
    content: String,
}

#[tauri::command]
fn open_newick_file(app: tauri::AppHandle, recent: State<RecentFiles>) -> Result<OpenFileResult, String> {
    let picked = tauri::api::dialog::blocking::FileDialogBuilder::new()
        .add_filter("Newick", &["nwk", "newick", "tree"])
        .pick_file();

    let path: PathBuf = picked.ok_or("No file selected")?;
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {e}"))?;
    let path_str = path.to_string_lossy().to_string();

    if let Ok(mut files) = recent.0.lock() {
        files.retain(|p| p != &path_str);
        files.insert(0, path_str.clone());
        if files.len() > 10 {
            files.truncate(10);
        }
    }

    let _ = app.emit_all("desktop://opened-file", &path_str);

    Ok(OpenFileResult {
        path: path_str,
        content,
    })
}

#[tauri::command]
fn save_text_to_path(default_name: String, content: String) -> Result<String, String> {
    let target = tauri::api::dialog::blocking::FileDialogBuilder::new()
        .set_file_name(&default_name)
        .save_file();

    let path = target.ok_or("Save cancelled")?;
    fs::write(&path, content).map_err(|e| format!("Failed to save file: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_recent_files(recent: State<RecentFiles>) -> Vec<String> {
    if let Ok(files) = recent.0.lock() {
        return files.clone();
    }
    vec![]
}

#[tauri::command]
fn about_info() -> String {
    "Protein Tree Studio Desktop v0.1.0\nHelp: README.md\nUpdates: Desktop shell + native open/save scaffold".to_string()
}

fn main() {
    tauri::Builder::default()
        .manage(RecentFiles::default())
        .invoke_handler(tauri::generate_handler![
            open_newick_file,
            save_text_to_path,
            get_recent_files,
            about_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running Protein Tree Studio desktop app");
}
