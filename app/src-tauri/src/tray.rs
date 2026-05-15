use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Emitter, Manager,
};

pub fn setup_tray(app: &App) -> tauri::Result<()> {
    let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide Mika", true, None::<&str>)?;
    let pause = MenuItem::with_id(app, "pause", "Pause/Resume", true, None::<&str>)?;
    let feed = MenuItem::with_id(app, "feed", "Feed Mika", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &pause, &feed, &settings, &quit])?;

    let mut builder = TrayIconBuilder::new()
        .tooltip("Mika Desktop Pet")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show_hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(true) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "pause" => {
                let _ = app.emit("tray-pause-toggle", ());
            }
            "feed" => {
                let _ = app.emit("tray-feed", ());
            }
            "settings" => {
                let _ = app.emit("tray-settings", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        });

    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }

    builder.build(app)?;

    Ok(())
}
