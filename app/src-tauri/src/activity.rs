use rdev::{listen, Event, EventType};
use std::{
    sync::{Arc, Mutex},
    thread,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Emitter};

pub(crate) fn is_activity_event(event: &Event) -> bool {
    matches!(
        event.event_type,
        EventType::KeyPress(_)
            | EventType::ButtonPress(_)
            | EventType::MouseMove { .. }
            | EventType::Wheel { .. }
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use rdev::{Button, Key};
    use std::time::SystemTime;

    fn event(event_type: EventType) -> Event {
        Event {
            time: SystemTime::UNIX_EPOCH,
            name: None,
            event_type,
        }
    }

    #[test]
    fn recognizes_aggregate_activity_events() {
        assert!(is_activity_event(&event(EventType::KeyPress(Key::KeyA))));
        assert!(is_activity_event(&event(EventType::ButtonPress(
            Button::Left
        ))));
        assert!(is_activity_event(&event(EventType::MouseMove {
            x: 10.0,
            y: 20.0
        })));
        assert!(is_activity_event(&event(EventType::Wheel {
            delta_x: 0,
            delta_y: 1
        })));
    }

    #[test]
    fn ignores_release_events() {
        assert!(!is_activity_event(&event(EventType::KeyRelease(Key::KeyA))));
        assert!(!is_activity_event(&event(EventType::ButtonRelease(
            Button::Left
        ))));
    }
}

pub fn start_activity_listener(app: AppHandle) {
    thread::spawn(move || {
        let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(2)));
        let callback_last_emit = Arc::clone(&last_emit);

        let callback = move |event: Event| {
            if !is_activity_event(&event) {
                return;
            }

            let Ok(mut last) = callback_last_emit.lock() else {
                return;
            };

            if last.elapsed() < Duration::from_secs(1) {
                return;
            }

            *last = Instant::now();
            let _ = app.emit("activity-pulse", ());
        };

        if let Err(error) = listen(callback) {
            eprintln!("activity listener failed: {error:?}");
        }
    });
}
