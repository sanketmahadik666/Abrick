# Toilet Review System

A comprehensive web application for reviewing and rating public toilet facilities. Users can scan QR codes to submit reviews, while administrators manage facilities and monitor feedback through an intuitive dashboard.

## 🚀 Features

### For Users
- **QR Code Scanning**: Scan toilet QR codes to quickly access review forms
- **Interactive Map**: View nearby toilets with ratings and facilities
- **Comprehensive Reviews**: Rate cleanliness, maintenance, accessibility, and overall experience
- **Real-time Statistics**: See average ratings and review counts for each facility

### For Administrators
- **Dashboard Management**: Add, edit, and delete toilet facilities
- **Review Moderation**: View and delete inappropriate reviews
- **QR Code Generation**: Generate QR codes for new facilities
- **Analytics**: Monitor review statistics and facility performance
- **User Management**: Secure admin authentication system

### Key Highlights
- **No Database Required**: Uses runtime caching for instant deployment
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Ratings update immediately after review submission
- **Secure Authentication**: JWT-based admin access control
- **Offline-Capable**: Core functionality works without internet (with limitations)

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **Runtime Caching** (no database dependency)
- **JWT Authentication**
- **Bcrypt Password Hashing**

### Frontend
- **Vanilla JavaScript** (ES6+)
- **Leaflet.js** for interactive maps
- **HTML5 QR Code Scanner**
- **CSS3** with responsive design
- **Fetch API** for HTTP requests

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd toilet-review-system
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new admin account.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response:** Same as register

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Toilet Management Endpoints

#### GET `/api/toilet/map`
Get all toilets for map display.

**Response:**
```json
[
  {
    "id": "toilet_id",
    "name": "Central Park Toilet",
    "location": "Central Park, Downtown",
    "description": "Modern facility with full amenities",
    "coordinates": {
      "latitude": 40.7829,
      "longitude": -73.9654
    },
    "facilities": ["handicap", "baby_change", "shower"],
    "averageRating": 4.2,
    "totalReviews": 15
  }
]
```

#### GET `/api/toilet/:id`
Get detailed information about a specific toilet.

**Response:**
```json
{
  "id": "toilet_id",
  "name": "Central Park Toilet",
  "location": "Central Park, Downtown",
  "description": "Modern facility with full amenities",
  "coordinates": {
    "latitude": 40.7829,
    "longitude": -73.9654
  },
  "facilities": ["handicap", "baby_change", "shower"],
  "averageRating": 4.2,
  "totalReviews": 15,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/toilet/add`
Add a new toilet facility (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "New Toilet Facility",
  "location": "123 Main St, City",
  "description": "Description of the facility",
  "coordinates": {
    "latitude": 40.7829,
    "longitude": -73.9654
  },
  "facilities": ["handicap", "paper_towel"]
}
```

#### PUT `/api/toilet/:id`
Update toilet information (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:** Same as POST, only include fields to update

#### DELETE `/api/toilet/:id`
Delete a toilet facility (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Review Endpoints

#### POST `/api/review/submit`
Submit a new review.

**Request Body:**
```json
{
  "toiletId": "toilet_id",
  "rating": 5,
  "cleanliness": 4,
  "maintenance": 5,
  "accessibility": 4,
  "comment": "Great facility, very clean!"
}
```

#### GET `/api/review/toilet/:toiletId`
Get all reviews for a specific toilet.

**Response:**
```json
[
  {
    "id": "review_id",
    "toiletId": "toilet_id",
    "rating": 5,
    "cleanliness": 4,
    "maintenance": 5,
    "accessibility": 4,
    "comment": "Great facility, very clean!",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/review/all`
Get all reviews (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** Array of all reviews

#### DELETE `/api/review/:id`
Delete a review (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### GET `/api/review/stats`
Get review statistics (Admin only).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "totalReviews": 150,
  "averages": {
    "avgRating": 4.2,
    "avgCleanliness": 4.1,
    "avgMaintenance": 3.8,
    "avgAccessibility": 4.3
  }
}
```

## 🎯 Usage

### For Regular Users
1. **Browse Facilities**: Use the interactive map to find nearby toilets
2. **Scan QR Codes**: Point camera at toilet QR codes for instant review access
3. **Submit Reviews**: Rate facilities on multiple criteria
4. **View Statistics**: See how facilities rank compared to others

### For Administrators
1. **Register/Login**: Create admin account or login to existing one
2. **Manage Facilities**: Add new toilets with location and facility details
3. **Generate QR Codes**: Create printable QR codes for new facilities
4. **Monitor Reviews**: View all reviews, delete inappropriate content
5. **Analyze Data**: Check review statistics and facility performance

## 🏗️ Architecture

### Backend Architecture
- **Runtime Caching**: In-memory storage eliminates database setup
- **RESTful API**: Clean, consistent endpoint design
- **Middleware Protection**: JWT authentication for admin routes
- **Data Validation**: Input sanitization and error handling
- **Modular Design**: Separate concerns with models, routes, and middleware

### Frontend Architecture
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
- **Component-Based**: Reusable UI components and patterns
- **Async Operations**: Non-blocking API calls with proper error handling
- **Accessibility**: WCAG compliant with keyboard navigation

## 🌟 Key Benefits

### 🚀 **Zero-Configuration Deployment**
- No database setup required
- Single command deployment
- Instant startup time
- Perfect for demos and prototypes

### 📱 **Mobile-First Experience**
- Optimized for mobile devices
- Touch-friendly interfaces
- QR code scanning integration
- Offline-capable core features

### 🔒 **Secure & Scalable**
- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- RESTful API design

### 🎨 **Modern User Experience**
- Real-time map interactions
- Smooth animations and transitions
- Intuitive navigation
- Comprehensive feedback system

### 🛠️ **Developer-Friendly**
- Clean, documented code
- Modular architecture
- Easy to extend and customize
- Comprehensive API documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue on the GitHub repository.

---

**Built with ❤️ for better public facilities**