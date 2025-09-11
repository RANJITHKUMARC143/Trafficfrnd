# Traffic Frnd

A comprehensive mobile and web platform built with React Native and React that helps users order food and services while on the go or at home. The system consists of multiple applications: User App, Vendor App, Delivery Boy App, and Admin Console.

## System Components

### User App
- Drive & Order mode for on-the-go ordering
- Home Order mode for traditional delivery
- Real-time location tracking
- Route optimization with traffic consideration
- Category-based browsing
- Search functionality
- User profile management
- Order tracking
- Promotional offers

### Vendor App
- Real-time order management
- Menu and item management
- Order status updates
- Sales analytics and reports
- Inventory management
- Promotional campaign creation
- Customer feedback management

### Delivery Boy App
- Real-time order pickup and delivery tracking
- Route optimization for deliveries
- Earnings management
- Delivery history
- Status updates
- Navigation assistance
- Performance metrics

### Admin Console
- System-wide analytics and reporting
- User management
- Vendor management
- Delivery partner management
- Promotional campaign management
- Payment and transaction monitoring
- System configuration and settings

## Tech Stack

### Mobile Apps (User, Vendor, Delivery)
- React Native
- Expo
- TypeScript
- React Navigation
- Expo Location
- Google Maps Integration

### Admin Console
- React
- TypeScript
- Material-UI
- Redux
- Chart.js
- RESTful APIs

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/CurioSpry/Travel_friend.git
```

2. Install dependencies for each component
```bash
# For User App
cd user-app
npm install

# For Vendor App
cd ../vendor-app
npm install

# For Delivery Boy App
cd ../delivery-app
npm install

# For Admin Console
cd ../admin-console
npm install
```

3. Start the development servers
```bash
# For Mobile Apps
npx expo start

# For Admin Console
npm start
```

## Cloning This Repository with Submodules

This project uses git submodules (e.g., `Delivery_app`). To ensure you get all the code, including submodules, **clone the repository using:**

```sh
git clone --recurse-submodules https://github.com/RANJITHKUMARC143/Trafficfrnd.git
```

If you already cloned the repository without submodules, run:

```sh
git submodule update --init --recursive
```

This will fetch and initialize all submodules (such as `Delivery_app`) with the correct code.

**Note:**
- If you do not use these commands, the submodule folders may be empty or incomplete.
- Always push changes to both the main repo and any submodules you modify.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
