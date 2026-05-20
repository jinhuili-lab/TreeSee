export type DesktopOpenResult = { path: string; content: string }

declare global {
  interface Window {
    __TAURI__?: {
      core?: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
    }
  }
}

function tauriInvoke() {
  return window.__TAURI__?.core?.invoke
}

export function isDesktopRuntime() {
  return typeof tauriInvoke() === 'function'
}

export async function desktopOpenNewick(): Promise<DesktopOpenResult> {
  const invoke = tauriInvoke()
  if (!invoke) throw new Error('Not running in desktop runtime')
  return (await invoke('open_newick_file')) as DesktopOpenResult
}

export async function desktopSaveText(defaultName: string, content: string): Promise<string> {
  const invoke = tauriInvoke()
  if (!invoke) throw new Error('Not running in desktop runtime')
  return (await invoke('save_text_to_path', { defaultName, content })) as string
}

export async function desktopGetRecentFiles(): Promise<string[]> {
  const invoke = tauriInvoke()
  if (!invoke) return []
  return (await invoke('get_recent_files')) as string[]
}

export async function desktopAboutInfo(): Promise<string> {
  const invoke = tauriInvoke()
  if (!invoke) return 'Web runtime: use README.md for help.'
  return (await invoke('about_info')) as string
}
