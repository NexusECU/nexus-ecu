use std::{
    fs,
    io::{
        ErrorKind,
        Read,
    },
    sync::Mutex,
    time::Duration,
};

use serde::Serialize;

use std::ffi::c_void;

use serialport::{
    SerialPort,
    SerialPortType,
};

use tauri::State;

#[cfg(target_os = "windows")]
use winreg::{
    enums::{
        HKEY_LOCAL_MACHINE,
        KEY_READ,
        KEY_WOW64_32KEY,
        KEY_WOW64_64KEY,
    },
    RegKey,
};

#[cfg(target_os = "windows")]
use libloading::Library;

struct HardwareState {
    port:
        Option<
            Box<
                dyn SerialPort,
            >,
        >,

    port_name:
        Option<String>,

    baud_rate:
        Option<u32>,

    bytes_received:
        u64,
}

impl Default for HardwareState {
    fn default() -> Self {
        Self {
            port:
                None,

            port_name:
                None,

            baud_rate:
                None,

            bytes_received:
                0,
        }
    }
}

type SharedHardwareState =
    Mutex<HardwareState>;

#[cfg(target_os = "windows")]
struct J2534BridgeState {
    library:
        Option<Library>,

    device_id:
        Option<u32>,

    device_name:
        Option<String>,

    vendor:
        Option<String>,

    function_library:
        Option<String>,

    opened_at:
        Option<String>,

    last_error_code:
        Option<i32>,
}

#[cfg(target_os = "windows")]
impl Default for J2534BridgeState {
    fn default() -> Self {
        Self {
            library:
                None,

            device_id:
                None,

            device_name:
                None,

            vendor:
                None,

            function_library:
                None,

            opened_at:
                None,

            last_error_code:
                None,
        }
    }
}

#[cfg(not(target_os = "windows"))]
#[derive(Default)]
struct J2534BridgeState;

type SharedJ2534BridgeState =
    Mutex<J2534BridgeState>;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SerialDeviceInfo {
    port_name:
        String,

    port_type:
        String,

    vid:
        Option<u16>,

    pid:
        Option<u16>,

    serial_number:
        Option<String>,

    manufacturer:
        Option<String>,

    product:
        Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HardwareConnectionInfo {
    connected:
        bool,

    port_name:
        Option<String>,

    baud_rate:
        Option<u32>,

    bytes_received:
        u64,
}

fn connection_info(
    state:
        &HardwareState,
) -> HardwareConnectionInfo {
    HardwareConnectionInfo {
        connected:
            state.port
                .is_some(),

        port_name:
            state.port_name
                .clone(),

        baud_rate:
            state.baud_rate,

        bytes_received:
            state
                .bytes_received,
    }
}

#[tauri::command]
fn read_project_file(
    path: String,
) -> Result<String, String> {
    fs::read_to_string(
        &path,
    )
    .map_err(
        |error|
            format!(
                "Unable to read project file: {error}",
            ),
    )
}

#[tauri::command]
fn write_project_file(
    path: String,
    contents: String,
) -> Result<(), String> {
    fs::write(
        &path,
        contents,
    )
    .map_err(
        |error|
            format!(
                "Unable to write project file: {error}",
            ),
    )
}

#[tauri::command]
fn list_serial_ports()
    -> Result<
        Vec<
            SerialDeviceInfo,
        >,
        String,
    > {
    let ports =
        serialport::available_ports()
            .map_err(
                |error|
                    format!(
                        "Unable to enumerate serial interfaces: {error}",
                    ),
            )?;

    Ok(
        ports
            .into_iter()
            .map(
                |port| {
                    match port
                        .port_type
                    {
                        SerialPortType::UsbPort(
                            usb,
                        ) => {
                            SerialDeviceInfo {
                                port_name:
                                    port.port_name,

                                port_type:
                                    "USB"
                                        .to_string(),

                                vid:
                                    Some(
                                        usb.vid,
                                    ),

                                pid:
                                    Some(
                                        usb.pid,
                                    ),

                                serial_number:
                                    usb.serial_number,

                                manufacturer:
                                    usb.manufacturer,

                                product:
                                    usb.product,
                            }
                        }

                        SerialPortType::BluetoothPort => {
                            SerialDeviceInfo {
                                port_name:
                                    port.port_name,

                                port_type:
                                    "BLUETOOTH"
                                        .to_string(),

                                vid:
                                    None,

                                pid:
                                    None,

                                serial_number:
                                    None,

                                manufacturer:
                                    None,

                                product:
                                    None,
                            }
                        }

                        SerialPortType::PciPort => {
                            SerialDeviceInfo {
                                port_name:
                                    port.port_name,

                                port_type:
                                    "PCI"
                                        .to_string(),

                                vid:
                                    None,

                                pid:
                                    None,

                                serial_number:
                                    None,

                                manufacturer:
                                    None,

                                product:
                                    None,
                            }
                        }

                        SerialPortType::Unknown => {
                            SerialDeviceInfo {
                                port_name:
                                    port.port_name,

                                port_type:
                                    "UNKNOWN"
                                        .to_string(),

                                vid:
                                    None,

                                pid:
                                    None,

                                serial_number:
                                    None,

                                manufacturer:
                                    None,

                                product:
                                    None,
                            }
                        }
                    }
                },
            )
            .collect(),
    )
}

#[tauri::command]
fn connect_serial_port(
    port_name: String,
    baud_rate: u32,
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<
    HardwareConnectionInfo,
    String,
> {
    let port =
        serialport::new(
            &port_name,
            baud_rate,
        )
        .timeout(
            Duration::from_millis(
                5,
            ),
        )
        .open()
        .map_err(
            |error|
                format!(
                    "Unable to open {port_name} at {baud_rate} baud: {error}",
                ),
        )?;

    let mut state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    state.port =
        Some(
            port,
        );

    state.port_name =
        Some(
            port_name,
        );

    state.baud_rate =
        Some(
            baud_rate,
        );

    state.bytes_received =
        0;

    Ok(
        connection_info(
            &state,
        ),
    )
}

#[tauri::command]
fn disconnect_serial_port(
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<
    HardwareConnectionInfo,
    String,
> {
    let mut state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    state.port =
        None;

    state.port_name =
        None;

    state.baud_rate =
        None;

    Ok(
        connection_info(
            &state,
        ),
    )
}

#[tauri::command]
fn hardware_connection_status(
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<
    HardwareConnectionInfo,
    String,
> {
    let state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    Ok(
        connection_info(
            &state,
        ),
    )
}

#[tauri::command]
fn read_serial_bytes(
    maximum_bytes: usize,
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<
    Vec<u8>,
    String,
> {
    let mut state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    let maximum =
        maximum_bytes
            .clamp(
                1,
                4096,
            );

    let port =
        state.port
            .as_mut()
            .ok_or_else(
                ||
                    "No hardware interface is connected."
                        .to_string(),
            )?;

    let mut buffer =
        vec![
            0u8;
            maximum
        ];

    match port.read(
        &mut buffer,
    ) {
        Ok(
            bytes_read,
        ) => {
            buffer.truncate(
                bytes_read,
            );

            state.bytes_received +=
                bytes_read as u64;

            Ok(
                buffer,
            )
        }

        Err(
            error,
        ) if error.kind() ==
            ErrorKind::TimedOut => {
            Ok(
                Vec::new(),
            )
        }

        Err(
            error,
        ) => {
            Err(
                format!(
                    "Serial receive failed: {error}",
                ),
            )
        }
    }
}

fn slcan_speed_command(
    bitrate_kbps: u32,
) -> Result<
    &'static str,
    String,
> {
    match bitrate_kbps {
        10 =>
            Ok("S0\r"),

        20 =>
            Ok("S1\r"),

        50 =>
            Ok("S2\r"),

        100 =>
            Ok("S3\r"),

        125 =>
            Ok("S4\r"),

        250 =>
            Ok("S5\r"),

        500 =>
            Ok("S6\r"),

        800 =>
            Ok("S7\r"),

        1000 =>
            Ok("S8\r"),

        _ =>
            Err(
                format!(
                    "Unsupported Lawicel standard CAN bitrate: {bitrate_kbps} kbit/s",
                ),
            ),
    }
}

fn write_adapter_command(
    port:
        &mut dyn SerialPort,
    command:
        &str,
) -> Result<(), String> {
    port.write_all(
        command.as_bytes(),
    )
    .map_err(
        |error|
            format!(
                "Unable to configure CAN adapter: {error}",
            ),
    )?;

    port.flush()
        .map_err(
            |error|
                format!(
                    "Unable to flush CAN adapter command: {error}",
                ),
        )?;

    std::thread::sleep(
        Duration::from_millis(
            25,
        ),
    );

    Ok(())
}

#[tauri::command]
fn configure_slcan_monitor(
    bitrate_kbps: u32,
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<bool, String> {
    let mut state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    let port =
        state.port
            .as_mut()
            .ok_or_else(
                ||
                    "No hardware interface is connected."
                        .to_string(),
            )?;

    let speed_command =
        slcan_speed_command(
            bitrate_kbps,
        )?;

    /*
     * These are adapter-control commands only:
     * clear stale command state, close CAN,
     * set bitrate, then open CAN.
     *
     * There is intentionally no command here for
     * transmitting a CAN data/RTR frame.
     */
    write_adapter_command(
        port.as_mut(),
        "\r",
    )?;

    write_adapter_command(
        port.as_mut(),
        "\r",
    )?;

    write_adapter_command(
        port.as_mut(),
        "C\r",
    )?;

    write_adapter_command(
        port.as_mut(),
        speed_command,
    )?;

    write_adapter_command(
        port.as_mut(),
        "O\r",
    )?;

    Ok(true)
}

#[tauri::command]
fn close_slcan_monitor(
    hardware:
        State<
            '_,
            SharedHardwareState,
        >,
) -> Result<bool, String> {
    let mut state =
        hardware
            .lock()
            .map_err(
                |_|
                    "Hardware connection state is unavailable."
                        .to_string(),
            )?;

    let port =
        state.port
            .as_mut()
            .ok_or_else(
                ||
                    "No hardware interface is connected."
                        .to_string(),
            )?;

    write_adapter_command(
        port.as_mut(),
        "C\r",
    )?;

    Ok(true)
}


#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct J2534Connection {
    connected:
        bool,

    device_id:
        Option<u32>,

    device_name:
        Option<String>,

    vendor:
        Option<String>,

    function_library:
        Option<String>,

    opened_at:
        Option<String>,

    last_error_code:
        Option<i32>,

    status:
        String,
}

#[cfg(target_os = "windows")]
fn j2534_connection_info(
    state:
        &J2534BridgeState,
) -> J2534Connection {
    J2534Connection {
        connected:
            state.device_id
                .is_some(),

        device_id:
            state.device_id,

        device_name:
            state.device_name
                .clone(),

        vendor:
            state.vendor
                .clone(),

        function_library:
            state.function_library
                .clone(),

        opened_at:
            state.opened_at
                .clone(),

        last_error_code:
            state.last_error_code,

        status:
            if state.device_id
                .is_some()
            {
                "DEVICE OPEN · NO CHANNEL"
                    .to_string()
            } else {
                "DISCONNECTED"
                    .to_string()
            },
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct J2534Device {
    name:
        String,

    vendor:
        Option<String>,

    function_library:
        String,

    config_application:
        Option<String>,

    registry_path:
        String,

    architecture:
        String,

    dll_loadable:
        bool,

    has_pass_thru_open:
        bool,

    has_pass_thru_close:
        bool,

    has_pass_thru_connect:
        bool,

    has_pass_thru_disconnect:
        bool,

    has_pass_thru_read_msgs:
        bool,

    has_pass_thru_write_msgs:
        bool,

    error:
        Option<String>,
}

#[cfg(target_os = "windows")]
fn read_string_value(
    key:
        &RegKey,
    names:
        &[&str],
) -> Option<String> {
    for name in names {
        if let Ok(
            value,
        ) =
            key.get_value::<String, _>(
                name,
            )
        {
            if !value.trim()
                .is_empty()
            {
                return Some(
                    value,
                );
            }
        }
    }

    None
}

#[cfg(target_os = "windows")]
fn inspect_j2534_dll(
    path:
        &str,
) -> (
    bool,
    bool,
    bool,
    bool,
    bool,
    bool,
    bool,
    Option<String>,
) {
    unsafe {
        match Library::new(
            path,
        ) {
            Ok(
                library,
            ) => {
                let has =
                    |symbol:
                        &[u8]|
                     -> bool {
                        library
                            .get::<*const ()>(
                                symbol,
                            )
                            .is_ok()
                    };

                (
                    true,
                    has(b"PassThruOpen\0"),
                    has(b"PassThruClose\0"),
                    has(b"PassThruConnect\0"),
                    has(b"PassThruDisconnect\0"),
                    has(b"PassThruReadMsgs\0"),
                    has(b"PassThruWriteMsgs\0"),
                    None,
                )
            }

            Err(
                error,
            ) => (
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                Some(
                    format!(
                        "Unable to load J2534 DLL: {error}",
                    ),
                ),
            ),
        }
    }
}

#[cfg(target_os = "windows")]
fn scan_j2534_registry_view(
    access:
        u32,
    architecture:
        &str,
    output:
        &mut Vec<J2534Device>,
) {
    let hklm =
        RegKey::predef(
            HKEY_LOCAL_MACHINE,
        );

    let roots = [
        r"SOFTWARE\PassThruSupport.04.04",
        r"SOFTWARE\PassThruSupport.05.00",
    ];

    for root_path in roots {
        let root =
            match hklm
                .open_subkey_with_flags(
                    root_path,
                    KEY_READ |
                        access,
                )
            {
                Ok(
                    key,
                ) =>
                    key,

                Err(_) =>
                    continue,
            };

        for child_name in
            root.enum_keys()
                .flatten()
        {
            let child =
                match root
                    .open_subkey_with_flags(
                        &child_name,
                        KEY_READ |
                            access,
                    )
                {
                    Ok(
                        key,
                    ) =>
                        key,

                    Err(_) =>
                        continue,
                };

            let function_library =
                match read_string_value(
                    &child,
                    &[
                        "FunctionLibrary",
                        "Function Library",
                    ],
                )
                {
                    Some(
                        value,
                    ) =>
                        value,

                    None =>
                        continue,
                };

            let name =
                read_string_value(
                    &child,
                    &[
                        "Name",
                        "DeviceName",
                    ],
                )
                .unwrap_or_else(
                    ||
                        child_name
                            .clone(),
                );

            let vendor =
                read_string_value(
                    &child,
                    &[
                        "Vendor",
                        "Manufacturer",
                    ],
                );

            let config_application =
                read_string_value(
                    &child,
                    &[
                        "ConfigApplication",
                        "Config Application",
                    ],
                );

            let (
                dll_loadable,
                has_pass_thru_open,
                has_pass_thru_close,
                has_pass_thru_connect,
                has_pass_thru_disconnect,
                has_pass_thru_read_msgs,
                has_pass_thru_write_msgs,
                error,
            ) =
                inspect_j2534_dll(
                    &function_library,
                );

            output.push(
                J2534Device {
                    name,

                    vendor,

                    function_library,

                    config_application,

                    registry_path:
                        format!(
                            r"HKLM\{}\{}",
                            root_path,
                            child_name,
                        ),

                    architecture:
                        architecture
                            .to_string(),

                    dll_loadable,

                    has_pass_thru_open,

                    has_pass_thru_close,

                    has_pass_thru_connect,

                    has_pass_thru_disconnect,

                    has_pass_thru_read_msgs,

                    has_pass_thru_write_msgs,

                    error,
                },
            );
        }
    }
}

#[tauri::command]
fn discover_j2534_devices()
    -> Result<
        Vec<J2534Device>,
        String,
    > {
    #[cfg(
        target_os =
            "windows"
    )]
    {
        let mut devices =
            Vec::new();

        scan_j2534_registry_view(
            KEY_WOW64_32KEY,
            "32-bit",
            &mut devices,
        );

        scan_j2534_registry_view(
            KEY_WOW64_64KEY,
            "64-bit",
            &mut devices,
        );

        devices.sort_by(
            |a, b|
                a.name
                    .cmp(
                        &b.name,
                    )
                    .then_with(
                        ||
                            a.function_library
                                .cmp(
                                    &b.function_library,
                                ),
                    ),
        );

        devices.dedup_by(
            |a, b|
                a.function_library
                    .eq_ignore_ascii_case(
                        &b.function_library,
                    ),
        );

        Ok(
            devices,
        )
    }

    #[cfg(
        not(
            target_os =
                "windows"
        )
    )]
    {
        Ok(
            Vec::new(),
        )
    }
}


#[cfg(target_os = "windows")]
type PassThruOpenFn =
    unsafe extern "system" fn(
        *mut c_void,
        *mut u32,
    ) -> i32;

#[cfg(target_os = "windows")]
type PassThruCloseFn =
    unsafe extern "system" fn(
        u32,
    ) -> i32;

#[tauri::command]
fn open_j2534_device(
    device_name: String,
    vendor: Option<String>,
    function_library: String,
    bridge:
        State<
            '_,
            SharedJ2534BridgeState,
        >,
) -> Result<
    J2534Connection,
    String,
> {
    #[cfg(target_os = "windows")]
    {
        let mut state =
            bridge
                .lock()
                .map_err(
                    |_|
                        "J2534 bridge state is unavailable."
                            .to_string(),
                )?;

        if state.device_id
            .is_some()
        {
            return Err(
                "A J2534 device is already open. Close it before opening another device."
                    .to_string(),
            );
        }

        let library =
            unsafe {
                Library::new(
                    &function_library,
                )
            }
            .map_err(
                |error|
                    format!(
                        "Unable to load J2534 DLL '{}': {error}",
                        function_library,
                    ),
            )?;

        let pass_thru_open =
            unsafe {
                library
                    .get::<PassThruOpenFn>(
                        b"PassThruOpen\0",
                    )
            }
            .map_err(
                |error|
                    format!(
                        "J2534 DLL does not export PassThruOpen: {error}",
                    ),
            )?;

        let mut device_id:
            u32 = 0;

        let result =
            unsafe {
                pass_thru_open(
                    std::ptr::null_mut(),
                    &mut device_id,
                )
            };

        if result != 0 {
            state.last_error_code =
                Some(
                    result,
                );

            return Err(
                format!(
                    "PassThruOpen failed with J2534 status 0x{result:08X} ({result}). The interface may be unplugged, busy, unsupported by this process architecture, or already open elsewhere.",
                ),
            );
        }

        state.device_id =
            Some(
                device_id,
            );

        state.device_name =
            Some(
                device_name,
            );

        state.vendor =
            vendor;

        state.function_library =
            Some(
                function_library,
            );

        state.opened_at =
            Some(
                format!(
                    "{}",
                    std::time::SystemTime::now()
                        .duration_since(
                            std::time::UNIX_EPOCH,
                        )
                        .map(
                            |duration|
                                duration.as_secs(),
                        )
                        .unwrap_or(
                            0,
                        ),
                ),
            );

        state.last_error_code =
            Some(
                result,
            );

        /*
         * Keep the DLL loaded for the lifetime of the open
         * J2534 device. Vendor DLLs may own threads/resources
         * created by PassThruOpen.
         */
        state.library =
            Some(
                library,
            );

        Ok(
            j2534_connection_info(
                &state,
            ),
        )
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ =
            (
                device_name,
                vendor,
                function_library,
                bridge,
            );

        Err(
            "J2534 is currently supported only by the Windows desktop build."
                .to_string(),
        )
    }
}

#[tauri::command]
fn close_j2534_device(
    bridge:
        State<
            '_,
            SharedJ2534BridgeState,
        >,
) -> Result<
    J2534Connection,
    String,
> {
    #[cfg(target_os = "windows")]
    {
        let mut state =
            bridge
                .lock()
                .map_err(
                    |_|
                        "J2534 bridge state is unavailable."
                            .to_string(),
                )?;

        let device_id =
            match state
                .device_id
        {
            Some(
                value,
            ) =>
                value,

            None =>
                return Ok(
                    j2534_connection_info(
                        &state,
                    ),
                ),
        };

        let library =
            state.library
                .as_ref()
                .ok_or_else(
                    ||
                        "J2534 DLL is no longer loaded for the open device."
                            .to_string(),
                )?;

        let pass_thru_close =
            unsafe {
                library
                    .get::<PassThruCloseFn>(
                        b"PassThruClose\0",
                    )
            }
            .map_err(
                |error|
                    format!(
                        "J2534 DLL does not export PassThruClose: {error}",
                    ),
            )?;

        let result =
            unsafe {
                pass_thru_close(
                    device_id,
                )
            };

        state.last_error_code =
            Some(
                result,
            );

        if result != 0 {
            return Err(
                format!(
                    "PassThruClose failed with J2534 status 0x{result:08X} ({result}).",
                ),
            );
        }

        state.device_id =
            None;

        state.device_name =
            None;

        state.vendor =
            None;

        state.function_library =
            None;

        state.opened_at =
            None;

        /*
         * Drop the vendor DLL only after a successful
         * PassThruClose.
         */
        state.library =
            None;

        Ok(
            j2534_connection_info(
                &state,
            ),
        )
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ =
            bridge;

        Err(
            "J2534 is currently supported only by the Windows desktop build."
                .to_string(),
        )
    }
}

#[tauri::command]
fn j2534_connection_status(
    bridge:
        State<
            '_,
            SharedJ2534BridgeState,
        >,
) -> Result<
    J2534Connection,
    String,
> {
    #[cfg(target_os = "windows")]
    {
        let state =
            bridge
                .lock()
                .map_err(
                    |_|
                        "J2534 bridge state is unavailable."
                            .to_string(),
                )?;

        Ok(
            j2534_connection_info(
                &state,
            ),
        )
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ =
            bridge;

        Ok(
            J2534Connection {
                connected:
                    false,

                device_id:
                    None,

                device_name:
                    None,

                vendor:
                    None,

                function_library:
                    None,

                opened_at:
                    None,

                last_error_code:
                    None,

                status:
                    "UNSUPPORTED PLATFORM"
                        .to_string(),
            },
        )
    }
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .manage(
            SharedHardwareState::default(),
        )
        .manage(
            SharedJ2534BridgeState::default(),
        )
        .plugin(
            tauri_plugin_dialog::init(),
        )
        .invoke_handler(
            tauri::generate_handler![
                read_project_file,
                write_project_file,
                list_serial_ports,
                connect_serial_port,
                disconnect_serial_port,
                hardware_connection_status,
                read_serial_bytes,
                configure_slcan_monitor,
                close_slcan_monitor,
                discover_j2534_devices,
                open_j2534_device,
                close_j2534_device,
                j2534_connection_status,
            ],
        )
        .run(
            tauri::generate_context!(),
        )
        .expect(
            "error while running NEXUS ECU",
        );
}
