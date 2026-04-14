import {ImageSourcePropType} from 'react-native';

export const HOME_HERO_BANNER_SOURCE: ImageSourcePropType = require('../assets/images/hero_banner.png');

const PRODUCT_IMAGE_SOURCES: Record<string, ImageSourcePropType> = {
  'pi5-lab-kit': require('../assets/images/SBC and Edge AI/raspberry-pi5-cutout.png'),
  'jetson-orin-nano-dev-kit': require('../assets/images/SBC and Edge AI/product_JetsonNanoJetsonOrin Nano-cutout.png'),
  'beaglebone-black-industrial-controller': require('../assets/images/SBC and Edge AI/beaglebone-black-rev-c-4g-single-board-computer--cutout.png'),
  'orange-pi-5-max-edge-kit': require('../assets/images/SBC and Edge AI/Orange Pi 5 Max Edge Kit-cutout.png'),
  'rock-5b-vision-gateway': require('../assets/images/SBC and Edge AI/Rock 5B Vision Gateway-cutout.png'),

  'de10-nano': require('../assets/images/FPGA/DE10Nano-cutout.png'),
  'artix-a7-kit': require('../assets/images/FPGA/Artix-7 Motion Control Starter_-cutout.png'),
  'zynq-7020-vision-accelerator-board': require('../assets/images/FPGA/Zynq-7020 Vision Accelerator Board-cutout.png'),
  'spartan-7-signal-capture-kit': require('../assets/images/FPGA/Spartan-7 Signal Capture Kit-cutout.png'),
  'cyclone-10-lp-logic-trainer': require('../assets/images/FPGA/Cyclone 10 LP Logic Trainer-cutout.png'),

  'ros2-rover-kit': require('../assets/images/Robotics Motion/ROS2 Rover Chassis Kit-cutout.png'),
  'differential-drive-robot-base': require('../assets/images/Robotics Motion/Differential Drive Robot Base-cutout.png'),
  'robotic-arm-4dof-kit': require('../assets/images/Robotics Motion/4DOF Robotic Arm Starter Kit-cutout.png'),
  'mecanum-wheel-mobile-platform': require('../assets/images/Robotics Motion/Mecanum Wheel Mobile Platform-cutout.png'),
  'agv-navigation-chassis-pro': require('../assets/images/Robotics Motion/AGV Navigation Chassis Pro-cutout.png'),

  'lidar-slam-core': require('../assets/images/Sensors/360 lidar sensor module isolated-cutout.png'),
  'vision-cam-kit': require('../assets/images/Sensors/Stereo Vision Camera Kit -cutout.png'),
  'industrial-tof-depth-sensor': require('../assets/images/Sensors/Industrial ToF Depth Sensor-cutout.png'),
  'imu-9axis-motion-module': require('../assets/images/Sensors/IMU 9-axis Motion Module-cutout.png'),
  'thermal-inspection-camera-board': require('../assets/images/Sensors/Thermal Inspection Camera Board-cutout.png'),

  'can-motor-drive': require('../assets/images/Power and IO/Dual CAN Motor Driver 30A-cutout.png'),
  'field-io-power-hat': require('../assets/images/Power and IO/24V Field IO and Power HAT-cutout.png'),
  'relay-control-board-8ch': require('../assets/images/Power and IO/8-Channel Relay Control Board-cutout.png'),
  'smart-battery-management-module': require('../assets/images/Power and IO/battery management board isolated product-cutout.png'),
  'din-rail-power-monitor': require('../assets/images/Power and IO/DIN Rail Power Supply Monitor-cutout.png'),

  'stm32-sensor-hub': require('../assets/images/Connectivity/STM32 Sensor Hub Gateway-cutout.png'),
  'industrial-rs485-can-gateway': require('../assets/images/Connectivity/Industrial RS485CAN Gateway-cutout.png'),
  'wifi-6-ble-edge-module': require('../assets/images/Connectivity/Wi-Fi 6 + BLE Edge Module-cutout.png'),
  'lora-telemetry-node-board': require('../assets/images/Connectivity/LoRa Telemetry Node Board-cutout.png'),
  'router-hat-5g-sbc': require('../assets/images/Connectivity/5G Router HAT for SBC-cutout.png'),
};

export const getProductImageSource = (productId: string): ImageSourcePropType | undefined =>
  PRODUCT_IMAGE_SOURCES[productId];
