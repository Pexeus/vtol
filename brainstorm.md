# VTOL Software

## Whats needed:
- very fast video tranmit system (udp is a must)
- very fast control input stream
- realtime telemetry
- administrative abilities (change mode, set mission etc.)
- intuitive and easy to use ground station UI
- failsafe handling on all components (GCS, companion, FC, server)

## Components

### Onboard Code
Written in Nodejs and Python:
 - Node is the main/parent process and handles all flight controller interactions. recieves commands and sends telementry
 - a python subprocess handles only the video stream. Node has no bindings to the Picamera-2 library so python is a must

### Server
Written in Nodejs

