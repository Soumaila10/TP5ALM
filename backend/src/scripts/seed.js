require('dotenv').config();
const { mongoose, connectDB } = require('../config/db');
const Stadium = require('../models/Stadium');
const Match = require('../models/Match');
const Seat = require('../models/Seat');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const { logger } = require('../utils/logger');
const { loadEnv } = require('../config/env');

const STADIUMS_DATA = [
  { name: "MetLife Stadium", city: "East Rutherford", country: "USA", capacity: 82500 },
  { name: "SoFi Stadium", city: "Inglewood", country: "USA", capacity: 70240 },
  { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "USA", capacity: 71000 },
  { name: "Hard Rock Stadium", city: "Miami Gardens", country: "USA", capacity: 64767 },
  { name: "Gillette Stadium", city: "Foxborough", country: "USA", capacity: 65878 },
  { name: "Lincoln Financial Field", city: "Philadelphia", country: "USA", capacity: 69796 },
  { name: "Lumen Field", city: "Seattle", country: "USA", capacity: 69000 },
  { name: "Levi's Stadium", city: "Santa Clara", country: "USA", capacity: 68500 },
  { name: "Arrowhead Stadium", city: "Kansas City", country: "USA", capacity: 76416 },
  { name: "AT&T Stadium", city: "Arlington", country: "USA", capacity: 80000 },
  { name: "NRG Stadium", city: "Houston", country: "USA", capacity: 72220 },
  { name: "BC Place", city: "Vancouver", country: "Canada", capacity: 54500 },
  { name: "BMO Field", city: "Toronto", country: "Canada", capacity: 30000 },
  { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 87523 },
  { name: "Estadio BBVA", city: "Monterrey", country: "Mexico", capacity: 53500 },
  { name: "Estadio Akron", city: "Guadalajara", country: "Mexico", capacity: 48070 }
];

const TEAMS = [
  "Argentina", "France", "Brazil", "England", "Belgium", "Croatia", "Netherlands", "Italy",
  "Spain", "Portugal", "Morocco", "USA", "Mexico", "Canada", "Germany", "Senegal",
  "Japan", "Colombia", "Uruguay", "Switzerland", "Denmark", "Korea Republic", "Australia", "Ukraine"
];

async function seedData() {
  logger.info("Cleaning database...");
  await Stadium.deleteMany({});
  await Match.deleteMany({});
  await Seat.deleteMany({});
  await User.deleteMany({ role: 'admin' }); // Only delete seeded admin, leave others

  logger.info("Creating stadiums...");
  const createdStadiums = await Stadium.insertMany(STADIUMS_DATA);
  logger.info(`${createdStadiums.length} stadiums created.`);

  logger.info("Generating seats (50 per stadium for performance)...");
  const seatsToInsert = [];
  for (const stadium of createdStadiums) {
    // Generate 10 Category A seats
    for (let i = 1; i <= 10; i++) {
      seatsToInsert.push({
        stadiumId: stadium._id,
        section: "Main Grandstand (A)",
        row: "A",
        number: i,
        category: "A",
        price: 250,
        status: "available"
      });
    }
    // Generate 15 Category B seats
    for (let i = 1; i <= 15; i++) {
      seatsToInsert.push({
        stadiumId: stadium._id,
        section: "Middle Ring (B)",
        row: "B",
        number: i,
        category: "B",
        price: 150,
        status: "available"
      });
    }
    // Generate 25 Category C seats
    for (let i = 1; i <= 25; i++) {
      seatsToInsert.push({
        stadiumId: stadium._id,
        section: "Upper Terrace (C)",
        row: "C",
        number: i,
        category: "C",
        price: 80,
        status: "available"
      });
    }
  }
  const createdSeats = await Seat.insertMany(seatsToInsert);
  logger.info(`${createdSeats.length} seats generated.`);

  logger.info("Generating 48 matches...");
  const matchesToInsert = [];
  
  for (let i = 0; i < 48; i++) {
    const stadium = createdStadiums[i % createdStadiums.length];
    
    // Choose two random distinct teams
    const teamAIndex = (i * 2) % TEAMS.length;
    const teamBIndex = (i * 2 + 1) % TEAMS.length;
    const teamA = TEAMS[teamAIndex];
    const teamB = TEAMS[teamBIndex];

    // Determine round
    let round = 'group';
    if (i >= 40) round = 'final';
    else if (i >= 36) round = 'semi';
    else if (i >= 30) round = 'quarter';
    else if (i >= 24) round = 'round16';

    // Set date (June - July 2026)
    const matchDate = new Date(2026, 5, 11 + (i % 30), 15 + (i % 6), 0, 0);

    matchesToInsert.push({
      teamA,
      teamB,
      round,
      group: round === 'group' ? String.fromCharCode(65 + (i % 8)) : undefined, // Groups A to H
      date: matchDate,
      stadiumId: stadium._id,
      totalSeats: 50,
      availableSeats: 50,
      isActive: true
    });
  }
  
  const createdMatches = await Match.insertMany(matchesToInsert);
  logger.info(`${createdMatches.length} matches created.`);

  logger.info("Creating default admin user...");
  const adminPasswordHash = await bcrypt.hash("Admin123!", 12);
  const adminUser = new User({
    email: "admin@fifa.com",
    passwordHash: adminPasswordHash,
    firstName: "FIFA",
    lastName: "Admin",
    phone: "+33100000000",
    role: "admin",
    isVerified: true
  });
  await adminUser.save();
  logger.info("Default admin user created: admin@fifa.com / Admin123!");
}

async function seed() {
  const env = loadEnv();
  
  const connectionUri = env.MONGODB_URI || env.COSMOS_CONNECTION_STRING;
  if (!connectionUri) {
    logger.error("Database connection URI (MONGODB_URI or COSMOS_CONNECTION_STRING) is missing in env. Seeding aborted.");
    process.exit(1);
  }

  await connectDB({
    uri: connectionUri,
    dbName: env.COSMOS_DB_NAME,
    logger
  });

  await seedData();

  logger.info("Database seeded successfully!");
  await mongoose.disconnect();
}

module.exports = { seedData, seed };

if (require.main === module) {
  seed().catch(err => {
    logger.error({ err }, "Error seeding database");
    process.exit(1);
  });
}

