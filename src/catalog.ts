import {ADDITIONAL_PRODUCTS} from './additionalCatalogProducts';

export type CategoryId =
  | 'all'
  | 'sbc'
  | 'fpga'
  | 'robotics'
  | 'sensors'
  | 'power'
  | 'connectivity';

export type Availability = 'In stock' | 'Low stock' | 'Pre-order';
export type SortMode =
  | 'popularity'
  | 'price-asc'
  | 'price-desc'
  | 'newest'
  | 'rating'
  | 'stock';
export type OrderStatus =
  | 'Delivered'
  | 'Processing'
  | 'Ready to ship'
  | 'Awaiting payment'
  | 'Cancellation review pending';

export interface Category {
  id: CategoryId;
  label: string;
  summary: string;
  shortCode: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  vendor: string;
  seller: string;
  category: Exclude<CategoryId, 'all'>;
  highlight: string;
  shortDescription: string;
  overview: string;
  price: number;
  previousPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  availability: Availability;
  leadTime: string;
  accent: string;
  panel: string;
  specs: ProductSpec[];
  tags: string[];
  applications: string[];
  compatibility: string[];
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  category: Exclude<CategoryId, 'all'>;
  accent: string;
}

export interface OrderLine {
  productId: string;
  quantity: number;
}

export const ORDER_CANCELLATION_REASONS = [
  'Changed project scope',
  'Need to edit shipping details',
  'Budget approval delayed',
  'Found an alternative part',
  'Created by mistake',
] as const;

export type OrderCancellationReason =
  (typeof ORDER_CANCELLATION_REASONS)[number];

export const CANCELLABLE_ORDER_STATUSES = [
  'Awaiting payment',
  'Processing',
  'Ready to ship',
] as const satisfies readonly OrderStatus[];

export type CancellableOrderStatus =
  (typeof CANCELLABLE_ORDER_STATUSES)[number];

export interface OrderCancellationRequest {
  reason: OrderCancellationReason;
  requestedAt: string;
  previousStatus: CancellableOrderStatus;
}

export const isCancellableOrderStatus = (
  status: OrderStatus,
): status is CancellableOrderStatus =>
  (CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(status);

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  total: number;
  items: number;
  lineItems: OrderLine[];
  cancelRequest?: OrderCancellationRequest;
}

export const CATEGORIES: Category[] = [
  {id: 'all', label: 'All Systems', summary: 'Browse the full bench', shortCode: 'ALL'},
  {id: 'sbc', label: 'SBC and Edge AI', summary: 'Linux boards and AI compute', shortCode: 'SBC'},
  {id: 'fpga', label: 'FPGA Boards', summary: 'Realtime logic and signal work', shortCode: 'FPG'},
  {id: 'robotics', label: 'Robotics Motion', summary: 'Drivers, kits, and control', shortCode: 'ROB'},
  {id: 'sensors', label: 'Sensors', summary: 'Vision, ranging, and telemetry', shortCode: 'SNS'},
  {id: 'power', label: 'Power and IO', summary: 'Motor power, CAN, and field IO', shortCode: 'PWR'},
  {id: 'connectivity', label: 'Connectivity', summary: 'Wireless and industrial buses', shortCode: 'BUS'},
];

export const PRODUCTS: Product[] = [
  {
    id: 'pi5-lab-kit',
    code: 'PI5',
    name: 'Raspberry Pi 5 Control Lab Kit',
    vendor: 'Raspberry Pi',
    seller: 'Embedded Shop Labs',
    category: 'sbc',
    highlight: '8GB edge computer for ROS2 and industrial prototyping',
    shortDescription: 'Bench-ready Pi 5 bundle with heatsink, PSU, and debug accessories.',
    overview:
      'A fast single-board computer for vision pipelines, PLC gateways, and robot supervisor tasks. Tuned for teams that need quick bring-up, GPIO access, and a clean path into Linux-based control software.',
    price: 3890000,
    previousPrice: 4290000,
    rating: 4.9,
    reviews: 128,
    stock: 18,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#41D7FF',
    panel: '#0D2636',
    specs: [
      {label: 'CPU', value: 'Quad-core Cortex-A76 2.4GHz'},
      {label: 'RAM', value: '8GB LPDDR4X'},
      {label: 'Video', value: 'Dual 4K output'},
      {label: 'I/O', value: '40-pin GPIO, USB 3.0, Gigabit LAN'},
    ],
    tags: ['ROS2', 'Machine vision', 'Gateway'],
    applications: ['Robot brain', 'HMI controller', 'Camera processing'],
    compatibility: ['CSI camera modules', 'CAN HATs', 'M.2 accelerators'],
  },
  {
    id: 'de10-nano',
    code: 'D10',
    name: 'DE10-Nano FPGA Development Board',
    vendor: 'Terasic',
    seller: 'Embedded Shop Labs',
    category: 'fpga',
    highlight: 'Cyclone V SoC board for realtime logic and HDL training',
    shortDescription: 'A strong bridge between Linux on ARM and deterministic FPGA fabric.',
    overview:
      'Ideal for computer vision accelerators, motor control loops, and custom bus interfaces. This board gives you a proven path from classroom FPGA exercises into production-style heterogeneous compute.',
    price: 6290000,
    previousPrice: 6890000,
    rating: 4.8,
    reviews: 74,
    stock: 7,
    availability: 'Low stock',
    leadTime: 'Ships in 48h',
    accent: '#8CFF7A',
    panel: '#163021',
    specs: [
      {label: 'FPGA', value: 'Intel Cyclone V SoC'},
      {label: 'Memory', value: '1GB DDR3'},
      {label: 'Storage', value: 'MicroSD slot'},
      {label: 'Interfaces', value: 'GPIO, HDMI, Ethernet, USB OTG'},
    ],
    tags: ['HDL', 'Realtime', 'Signal processing'],
    applications: ['Encoder capture', 'Low-latency control', 'Custom accelerators'],
    compatibility: ['Quartus workflows', 'Linux host apps', 'Vision daughter boards'],
  },
  {
    id: 'artix-a7-kit',
    code: 'A7K',
    name: 'Artix-7 Motion Control Starter',
    vendor: 'Logic Forge',
    seller: 'Embedded Shop Labs',
    category: 'fpga',
    highlight: 'Compact Artix-7 board for servo loops and sensor fusion',
    shortDescription: 'A practical FPGA entry point for deterministic robotics subsystems.',
    overview:
      'This board is tuned for teams building custom PWM, encoder processing, or hard realtime interfaces around industrial sensors and motor loops. The compact format makes it easy to embed in prototypes.',
    price: 4720000,
    previousPrice: 5120000,
    rating: 4.7,
    reviews: 52,
    stock: 11,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#FFBA49',
    panel: '#322512',
    specs: [
      {label: 'FPGA', value: 'Xilinx Artix-7'},
      {label: 'Clock', value: '100MHz onboard oscillator'},
      {label: 'Debug', value: 'USB JTAG and UART'},
      {label: 'Expansion', value: 'PMOD, FMC-lite'},
    ],
    tags: ['Motion control', 'PWM', 'Encoder'],
    applications: ['Servo drives', 'Robot joints', 'Industrial timing'],
    compatibility: ['PMOD sensor kits', 'Stepper drivers', 'Custom carrier boards'],
  },
  {
    id: 'lidar-slam-core',
    code: 'LDR',
    name: 'Lidar SLAM Core 360',
    vendor: 'RangePulse',
    seller: 'Embedded Shop Labs',
    category: 'sensors',
    highlight: '360-degree ranging module for mapping and navigation',
    shortDescription: 'Stable UART and USB lidar module for indoor robot navigation.',
    overview:
      'A dependable ranging module for AMR prototypes, mobile robots, and warehouse mapping demos. It pairs cleanly with Raspberry Pi or Jetson-class compute and is easy to visualize in ROS tooling.',
    price: 2980000,
    previousPrice: 3390000,
    rating: 4.8,
    reviews: 96,
    stock: 22,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#FF7A98',
    panel: '#341B2B',
    specs: [
      {label: 'Scan rate', value: '10Hz'},
      {label: 'Range', value: '0.15m to 12m'},
      {label: 'Interface', value: 'USB and UART'},
      {label: 'Power', value: '5V DC'},
    ],
    tags: ['Navigation', 'Mapping', 'ROS2'],
    applications: ['AMR mapping', 'Obstacle detection', 'Indoor localization'],
    compatibility: ['Raspberry Pi', 'Jetson Orin Nano', 'ROS2 SLAM stacks'],
  },
  {
    id: 'can-motor-drive',
    code: 'CAN',
    name: 'Dual CAN Motor Driver 30A',
    vendor: 'Motion Axis',
    seller: 'Embedded Shop Labs',
    category: 'power',
    highlight: 'Brushless and brushed motor driver with fieldbus integration',
    shortDescription: 'Industrial-style driver board for mobile robots and actuators.',
    overview:
      'Designed for robotic motion prototypes that need reliable current handling, CAN control, and compact installation. Great for differential drive bases, conveyor subsystems, and robotic arms.',
    price: 2140000,
    previousPrice: 2390000,
    rating: 4.6,
    reviews: 61,
    stock: 16,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#A7FF5C',
    panel: '#20310F',
    specs: [
      {label: 'Current', value: '30A peak dual channel'},
      {label: 'Bus', value: 'CAN 2.0B'},
      {label: 'Voltage', value: '12V to 36V'},
      {label: 'Feedback', value: 'Encoder input and fault lines'},
    ],
    tags: ['Motor control', 'CAN bus', 'Robot drive'],
    applications: ['AGV base', 'Linear actuators', 'Servo loops'],
    compatibility: ['24V battery packs', 'Pi CAN HATs', 'Industrial encoders'],
  },
  {
    id: 'ros2-rover-kit',
    code: 'RVR',
    name: 'ROS2 Rover Chassis Kit',
    vendor: 'Robot Foundry',
    seller: 'Embedded Shop Labs',
    category: 'robotics',
    highlight: 'Four-wheel development chassis for sensing and autonomy stacks',
    shortDescription: 'A modular base kit with frame, wheels, mounts, and expansion rails.',
    overview:
      'Built for teams that want to stand up an autonomous mobile robot quickly. The frame accepts common compute boards, battery packs, and sensor towers without needing a machine shop to get started.',
    price: 5490000,
    previousPrice: 5890000,
    rating: 4.9,
    reviews: 44,
    stock: 5,
    availability: 'Low stock',
    leadTime: 'Ships in 72h',
    accent: '#41D7FF',
    panel: '#14263E',
    specs: [
      {label: 'Frame', value: 'Anodized aluminum modular rails'},
      {label: 'Drive', value: '4-wheel skid steer'},
      {label: 'Payload', value: 'Up to 8kg'},
      {label: 'Mounts', value: 'Pi, Jetson, lidar, camera plates'},
    ],
    tags: ['Rover', 'AMR', 'Prototype'],
    applications: ['Warehouse demo', 'Autonomy stack', 'Research robot'],
    compatibility: ['Lidar towers', 'Depth cameras', 'CAN motor drivers'],
  },
  {
    id: 'stm32-sensor-hub',
    code: 'M4H',
    name: 'STM32 Sensor Hub Gateway',
    vendor: 'STM Micro Integrations',
    seller: 'Embedded Shop Labs',
    category: 'connectivity',
    highlight: 'Field sensor concentrator with RS485, CAN, and BLE telemetry',
    shortDescription: 'Small-footprint MCU gateway for rugged sensor aggregation.',
    overview:
      'Use this board when your robot or machine has many sensor edges and needs a dependable microcontroller node between the noisy physical world and the main compute stack.',
    price: 1640000,
    previousPrice: 1810000,
    rating: 4.7,
    reviews: 58,
    stock: 24,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#8B9CFF',
    panel: '#1D2246',
    specs: [
      {label: 'MCU', value: 'STM32 Cortex-M4'},
      {label: 'Buses', value: 'CAN, RS485, I2C, SPI, UART'},
      {label: 'Wireless', value: 'BLE 5 telemetry'},
      {label: 'Power', value: '9V to 24V DC input'},
    ],
    tags: ['Gateway', 'Industrial IO', 'Telemetry'],
    applications: ['Sensor bridge', 'Protocol converter', 'Edge diagnostics'],
    compatibility: ['PLC cabinets', 'Robot sensors', 'Battery systems'],
  },
  {
    id: 'vision-cam-kit',
    code: 'VIS',
    name: 'Stereo Vision Camera Kit',
    vendor: 'Optic Motion',
    seller: 'Embedded Shop Labs',
    category: 'sensors',
    highlight: 'Depth-aware stereo camera tuned for edge perception',
    shortDescription: 'Dual-lens vision kit for object tracking and scene understanding.',
    overview:
      'This kit gives embedded teams a clean starting point for obstacle detection, depth estimation, and camera-based inspection. It pairs especially well with Pi 5 and Jetson-class boards.',
    price: 3560000,
    previousPrice: 3920000,
    rating: 4.8,
    reviews: 67,
    stock: 13,
    availability: 'In stock',
    leadTime: 'Ships in 48h',
    accent: '#61F7D6',
    panel: '#103A33',
    specs: [
      {label: 'Resolution', value: '2 x 1080p global shutter'},
      {label: 'Depth', value: 'Stereo disparity pipeline'},
      {label: 'Output', value: 'USB 3.0'},
      {label: 'Sync', value: 'Trigger and timestamp support'},
    ],
    tags: ['Vision', 'Depth', 'Inspection'],
    applications: ['Pick and place', 'Obstacle avoidance', 'Quality inspection'],
    compatibility: ['Pi 5', 'Jetson', 'ROS2 image pipelines'],
  },
  {
    id: 'field-io-power-hat',
    code: 'HAT',
    name: '24V Field IO and Power HAT',
    vendor: 'BusWorks',
    seller: 'Embedded Shop Labs',
    category: 'power',
    highlight: 'Industrial IO expansion for Raspberry Pi gateways',
    shortDescription: 'Power conditioning, isolated IO, and terminal block convenience.',
    overview:
      'If you are building a Pi-based gateway for sensors, relays, or industrial cabinets, this HAT keeps power input stable and wiring clean while exposing the signals that matter on the bench.',
    price: 1290000,
    previousPrice: 1490000,
    rating: 4.6,
    reviews: 39,
    stock: 31,
    availability: 'In stock',
    leadTime: 'Ships in 24h',
    accent: '#FFBA49',
    panel: '#3A2A12',
    specs: [
      {label: 'Input', value: '9V to 24V terminal block'},
      {label: 'IO', value: 'Isolated digital IO and relay outputs'},
      {label: 'Protection', value: 'Reverse polarity and surge guard'},
      {label: 'Mount', value: 'DIN and panel-friendly form factor'},
    ],
    tags: ['Field IO', 'Pi HAT', 'Industrial cabinet'],
    applications: ['PLC gateway', 'Alarm controller', 'Remote monitoring'],
    compatibility: ['Raspberry Pi 4 and 5', 'DIN enclosures', 'Relay harnesses'],
  },
  ...ADDITIONAL_PRODUCTS,
];

export const HOME_COLLECTIONS: Collection[] = [
  {
    id: 'rapid-proto',
    title: 'Rapid Prototype Bench',
    subtitle: 'Bring-up kits',
    summary: 'SBC, power, and sensor combos for teams that need a working demo fast.',
    category: 'sbc',
    accent: '#41D7FF',
  },
  {
    id: 'motion-stack',
    title: 'Motion and Control Stack',
    subtitle: 'Robotics',
    summary: 'Driver boards, rover chassis, and feedback hardware for mobile platforms.',
    category: 'robotics',
    accent: '#B7FF5A',
  },
  {
    id: 'logic-lab',
    title: 'Realtime Logic Lab',
    subtitle: 'FPGA',
    summary: 'Deterministic hardware for signal capture, PWM, and custom acceleration.',
    category: 'fpga',
    accent: '#FFBA49',
  },
];

export const TRENDING_TERMS = [
  'ROS2',
  'FPGA',
  'Raspberry Pi',
  'Motor driver',
  'Lidar',
  'Industrial IO',
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ES-24118',
    date: '2026-03-18',
    status: 'Delivered',
    total: 3890000,
    items: 1,
    lineItems: [{productId: 'pi5-lab-kit', quantity: 1}],
  },
  {
    id: 'ES-24092',
    date: '2026-03-14',
    status: 'Ready to ship',
    total: 8420000,
    items: 2,
    lineItems: [
      {productId: 'de10-nano', quantity: 1},
      {productId: 'stm32-sensor-hub', quantity: 1},
    ],
  },
  {
    id: 'ES-24051',
    date: '2026-03-08',
    status: 'Processing',
    total: 5120000,
    items: 2,
    lineItems: [
      {productId: 'can-motor-drive', quantity: 1},
      {productId: 'field-io-power-hat', quantity: 2},
    ],
  },
];

export const PRODUCT_INDEX = PRODUCTS.reduce<Record<string, Product>>((index, product) => {
  index[product.id] = product;
  return index;
}, {});
