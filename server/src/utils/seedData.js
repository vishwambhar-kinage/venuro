import bcrypt from 'bcryptjs';
import { dataStore } from '../models/dataStore.js';
import { QRService } from '../services/qrService.js';

export const seedInitialData = async () => {
  console.log('🌱 [Seed] Populating flagship entertainment catalog & presentation accounts...');

  // Reset store
  dataStore.users = [];
  dataStore.events = [];
  dataStore.shows = [];
  dataStore.bookings = [];
  dataStore.reviews = [];

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Create Core Role Accounts
  // Customer
  const customer = dataStore.createUser({
    _id: 'usr_normal_1',
    name: 'Aarav Sharma',
    email: 'user@venuro.com',
    password: defaultPassword,
    role: 'customer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    walletBalance: 2500,
    preferences: ['Concerts', 'Movies', 'Sports', 'Experiences']
  });

  // Organizer
  const organizer = dataStore.createUser({
    _id: 'usr_coord_1',
    name: 'Priya Mehta',
    organizationName: 'Starline Live Entertainment Pvt Ltd',
    email: 'coordinator@venuro.com',
    password: defaultPassword,
    role: 'organizer',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    walletBalance: 8500,
    preferences: ['Live Shows', 'Concerts', 'Festivals']
  });

  // Admin
  const admin = dataStore.createUser({
    _id: 'usr_admin_1',
    name: 'Vikramaditya Roy',
    email: 'admin@venuro.com',
    password: defaultPassword,
    role: 'admin',
    status: 'active',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    walletBalance: 25000,
    preferences: ['All Categories']
  });

  // 2. Comprehensive Published Events Across 5 Categories
  const events = [
    // ── MOVIES ─────────────────────────────────────────────────────────
    {
      _id: 'evt_dune2',
      title: 'Dune: Part Two (IMAX 3D Laser)',
      category: 'movies',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
      bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
      city: 'Mumbai',
      venueName: 'PVR INOX IMAX Laser, Palladium Lower Parel',
      address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai 400013',
      duration: '2h 46m',
      language: 'English (Dolby Atmos 7.1)',
      genre: ['Sci-Fi', 'Adventure', 'Action', 'IMAX Laser'],
      ageLimit: '13+',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler', 'Florence Pugh'],
      rating: 4.9,
      totalReviews: 842,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_deadpool',
      title: 'Deadpool & Wolverine (4DX 3D & IMAX)',
      category: 'movies',
      description: 'Marvel Studios presents their most explosive cinematic crossover. The Time Variance Authority pulls Wade Wilson from his quiet life, thrusting him into an audacious universe-saving mission alongside a reluctant Logan.',
      bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
      city: 'Delhi',
      venueName: 'PVR Superplex, Vegas Mall Dwarka',
      address: 'Sector 14, Dwarka, New Delhi, Delhi 110078',
      duration: '2h 08m',
      language: 'English / Hindi (3D Atmos)',
      genre: ['Action', 'Comedy', 'Superhero', 'Sci-Fi'],
      ageLimit: '16+',
      cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
      rating: 4.8,
      totalReviews: 619,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_interstellar',
      title: 'Interstellar: 10th Anniversary (IMAX 70mm Special)',
      category: 'movies',
      description: 'Christopher Nolan’s monumental sci-fi masterpiece returns to towering IMAX screens for its 10th anniversary. A team of intrepid explorers travels through a wormhole in space in an attempt to ensure humanity’s survival.',
      bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600',
      city: 'Bengaluru',
      venueName: 'PVR IMAX, Nexus Koramangala',
      address: 'Hosur Road, Koramangala, Bengaluru, Karnataka 560095',
      duration: '2h 49m',
      language: 'English (Original Uncompressed Sound)',
      genre: ['Sci-Fi', 'Drama', 'Adventure', 'IMAX 70mm'],
      ageLimit: 'All Ages',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
      rating: 5.0,
      totalReviews: 1290,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },

    // ── CONCERTS ────────────────────────────────────────────────────────
    {
      _id: 'evt_coldplay',
      title: 'Coldplay: Music of the Spheres World Tour',
      category: 'concerts',
      description: 'Experience the world’s most magical stadium show live in India! Spectacular kinetic dance floors, solar-powered laser spectacles, sustainable pyrotechnics, and timeless singalongs from "Yellow" to "Fix You" and "Viva La Vida".',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      city: 'Mumbai',
      venueName: 'DY Patil Stadium, Navi Mumbai',
      address: 'Sector 7, Nerul, Navi Mumbai, Maharashtra 400706',
      duration: '3h 15m',
      language: 'English',
      genre: ['Pop', 'Rock', 'Alternative', 'Stadium World Tour'],
      ageLimit: 'All Ages',
      cast: ['Chris Martin', 'Jonny Buckland', 'Guy Berryman', 'Will Champion'],
      rating: 5.0,
      totalReviews: 1420,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_diljit',
      title: 'Diljit Dosanjh: Dil-Luminati Stadium Tour',
      category: 'concerts',
      description: 'The monumental Punjabi music phenomenon sweeping the globe! Unmatched stadium energy, iconic dance anthems like "Lover", "Born to Shine", "Kinni Kinni", and "G.O.A.T" featuring international brass ensembles and world-class dancers.',
      bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600',
      city: 'Bengaluru',
      venueName: 'NICE Grounds, Tumkur Road',
      address: 'Bengaluru International Exhibition Centre, Bangalore, Karnataka 562123',
      duration: '3h 00m',
      language: 'Punjabi / Hindi',
      genre: ['Punjabi Pop', 'Hip-Hop', 'Folk Fusion', 'Arena Live'],
      ageLimit: '6+',
      cast: ['Diljit Dosanjh', 'Live International Brass Band & Troupe'],
      rating: 4.9,
      totalReviews: 980,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_arijit',
      title: 'Arijit Singh: Grand Symphony Tour 2026',
      category: 'concerts',
      description: 'An ethereal musical odyssey featuring 45-piece international symphonic musicians backing the soulful voice of India. Relive romantic anthems and classical acoustic renditions under open night skies.',
      bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      city: 'Delhi',
      venueName: 'Jawaharlal Nehru Stadium Arena',
      address: 'Pragati Vihar, Bhishma Pitamah Marg, New Delhi 110003',
      duration: '3h 30m',
      language: 'Hindi / Bengali',
      genre: ['Bollywood', 'Acoustic', 'Symphony', 'Soulful Live'],
      ageLimit: 'All Ages',
      cast: ['Arijit Singh', '45-Piece Philharmonic Orchestra'],
      rating: 4.9,
      totalReviews: 1110,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },

    // ── SPORTS ──────────────────────────────────────────────────────────
    {
      _id: 'evt_ipl2026',
      title: 'IPL 2026: Mumbai Indians vs Chennai Super Kings',
      category: 'sports',
      description: 'The monumental El Clásico of T20 cricket. Five-time champions lock horns at a sold-out, electric Wankhede Stadium. World-class fast bowling, blistering maximums, and unmatched stadium acoustics.',
      bannerUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
      city: 'Mumbai',
      venueName: 'Wankhede Stadium, Churchgate',
      address: 'Vinoo Mankad Rd, Churchgate, Mumbai, Maharashtra 400020',
      duration: '4h 00m',
      language: 'Stadium Atmosphere (Dual Hindi/English Live Commentary)',
      genre: ['Cricket', 'T20', 'Tournament Rivalry', 'Prime Sport'],
      ageLimit: 'All Ages',
      cast: ['Rohit Sharma', 'Hardik Pandya', 'MS Dhoni', 'Ruturaj Gaikwad', 'Jasprit Bumrah'],
      rating: 5.0,
      totalReviews: 1840,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_ind_aus',
      title: 'ICC T20 Championship: India vs Australia Blockbuster',
      category: 'sports',
      description: 'The ultimate cricket showdown at the world’s largest cricket colosseum. Over 100,000 passionate fans roaring in unison as the Men in Blue take on the reigning world champions under dazzling floodlights.',
      bannerUrl: 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600',
      city: 'Ahmedabad',
      venueName: 'Narendra Modi Stadium, Motera',
      address: 'Stadium Rd, Motera, Ahmedabad, Gujarat 380005',
      duration: '4h 15m',
      language: 'Live International Broadcast Audio',
      genre: ['Cricket', 'International T20', 'Championship'],
      ageLimit: 'All Ages',
      cast: ['Virat Kohli', 'Suryakumar Yadav', 'Travis Head', 'Pat Cummins', 'Glenn Maxwell'],
      rating: 5.0,
      totalReviews: 2100,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },

    // ── LIVE SHOWS & COMEDY ─────────────────────────────────────────────
    {
      _id: 'evt_zakir',
      title: 'Zakir Khan: Live & Uncensored (Sakht Launda)',
      category: 'live-shows',
      description: 'India’s most celebrated storyteller returns with a brand-new autobiographical special. Heartfelt warmth, signature relatable punchlines, childhood nostalgia, and emotional truths narrated as only Zakir can.',
      bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      city: 'Delhi',
      venueName: 'Siri Fort Auditorium, August Kranti Marg',
      address: 'Asian Games Village Complex, Siri Fort, New Delhi, Delhi 110049',
      duration: '2h 00m',
      language: 'Hindi',
      genre: ['Standup Comedy', 'Storytelling', 'Satire'],
      ageLimit: '16+',
      cast: ['Zakir Khan'],
      rating: 4.9,
      totalReviews: 730,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_mughal',
      title: 'Mughal-E-Azam: The Grand Musical',
      category: 'live-shows',
      description: 'The globally acclaimed Broadway-scale Indian theatrical spectacle. Directed by Feroz Abbas Khan with opulent Manish Malhotra costumes, 70 Kathak dancers performing live on stage, and soul-stirring classical ghazals.',
      bannerUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?w=600',
      city: 'Mumbai',
      venueName: 'The Grand Theatre, Nita Mukesh Ambani Cultural Centre (NMACC)',
      address: 'Jio World Centre, G Block BKC, Bandra Kurla Complex, Mumbai 400051',
      duration: '2h 30m',
      language: 'Urdu / Hindi with English Subtitles',
      genre: ['Musical Theatre', 'Broadway Production', 'Classical Kathak'],
      ageLimit: '10+',
      cast: ['Priyanka Barve', 'Nissar Khan', 'Dhanveer Singh', 'Live Ensemble'],
      rating: 5.0,
      totalReviews: 890,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },

    // ── EXPERIENCES ─────────────────────────────────────────────────────
    {
      _id: 'evt_cyberverse',
      title: 'Cyberverse VR: 4D Hyper-Reality Immersion',
      category: 'experiences',
      description: 'Step directly into a sprawling futuristic cyberpunk city. Full-body tactile haptic feedback armor, olfactory scent dispersal, wind currents, and free-roam optical spatial tracking in an expansive free-motion arena.',
      bannerUrl: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600',
      city: 'Bengaluru',
      venueName: 'Venuro Spatial Arena, 100 Feet Road Indiranagar',
      address: 'HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      duration: '1h 15m',
      language: 'Interactive Multilingual (Customizable)',
      genre: ['Virtual Reality', 'Gaming', 'Immersive Tech', 'Haptics'],
      ageLimit: '10+',
      cast: ['Cyberverse Operations Crew'],
      rating: 4.9,
      totalReviews: 320,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },
    {
      _id: 'evt_sunburn',
      title: 'Sunburn Arena: Electronic Music Festival 2026',
      category: 'experiences',
      description: 'India’s biggest dance music carnival. High-powered kinetic stage architecture, jaw-dropping CO2 cannons, synchronized wristband LEDs, and back-to-back headline DJ sets by world number ones.',
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
      city: 'Goa',
      venueName: 'Vagator Hilltop Arena, North Goa',
      address: 'Vagator Beach Road, Anjuna, Goa 403509',
      duration: '8h 00m',
      language: 'Electronic Dance Beats',
      genre: ['EDM', 'Music Festival', 'Nightlife Experience', 'Arena'],
      ageLimit: '18+',
      cast: ['Martin Garrix', 'Hardwell', 'Nucleya', 'Lost Stories'],
      rating: 4.9,
      totalReviews: 1540,
      status: 'PUBLISHED',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName
    },

    // ── SAMPLE PENDING APPROVAL & DRAFT EVENTS (For Admin & Organizer Demonstration) ──
    {
      _id: 'evt_pending_demo',
      title: 'Pune International Jazz & Blues Carnival 2026',
      category: 'concerts',
      description: 'A 2-day outdoor festival celebrating legendary jazz icons and contemporary fusion blues under lush banayan canopies with artisanal gourmet pop-ups.',
      bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
      city: 'Pune',
      venueName: 'Mahalakshmi Lawns, Karve Nagar',
      address: 'Near Rajaram Bridge, Sinhagad Rd, Pune, Maharashtra 411052',
      duration: '6h 00m',
      language: 'English',
      genre: ['Jazz', 'Blues', 'Acoustic', 'Outdoor Festival'],
      ageLimit: 'All Ages',
      cast: ['The Blue Note Ensemble', 'Soul Strings Quintet'],
      rating: 4.7,
      totalReviews: 0,
      status: 'PENDING_APPROVAL',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName,
      ticketCategories: [
        { name: 'VIP Lounge', price: 3499, capacity: 60, available: 60 },
        { name: 'General Lawn', price: 1299, capacity: 400, available: 400 }
      ]
    },
    {
      _id: 'evt_draft_demo',
      title: 'Standup Weekend Special with Anubhav Singh Bassi',
      category: 'live-shows',
      description: 'Brand new trial show stories exploring courtrooms, college hostels, and hilarious misadventures.',
      bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200',
      posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
      city: 'Mumbai',
      venueName: 'Bal Gandharva Rang Mandir, Bandra West',
      address: 'Junction of 24th & 32nd Road, Bandra West, Mumbai 400050',
      duration: '1h 45m',
      language: 'Hindi',
      genre: ['Standup Comedy', 'Anecdotal'],
      ageLimit: '16+',
      cast: ['Anubhav Singh Bassi'],
      rating: 4.8,
      totalReviews: 0,
      status: 'DRAFT',
      organizerId: organizer._id,
      coordinatorId: organizer._id,
      organizerName: organizer.organizationName,
      ticketCategories: [
        { name: 'Balcony Front', price: 999, capacity: 100, available: 100 },
        { name: 'Auditorium Stalls', price: 699, capacity: 250, available: 250 }
      ]
    }
  ];

  events.forEach(evt => dataStore.createEvent(evt));

  // 3. Create Diverse Showtimes
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const shows = [
    { _id: 'shw_dune2_1', eventId: 'evt_dune2', screenName: 'IMAX Laser Audi 1 (Dolby Atmos)', date: today, startTime: '16:00', endTime: '18:46' },
    { _id: 'shw_dune2_2', eventId: 'evt_dune2', screenName: 'IMAX Laser Audi 1 (Dolby Atmos)', date: today, startTime: '19:45', endTime: '22:30' },
    { _id: 'shw_dune2_3', eventId: 'evt_dune2', screenName: 'IMAX Laser Audi 1 (Dolby Atmos)', date: tomorrow, startTime: '20:15', endTime: '23:00' },
    { _id: 'shw_deadpool_1', eventId: 'evt_deadpool', screenName: '4DX Motion Theater Audi 3', date: today, startTime: '18:30', endTime: '20:40' },
    { _id: 'shw_deadpool_2', eventId: 'evt_deadpool', screenName: 'IMAX Laser Audi 1', date: tomorrow, startTime: '21:00', endTime: '23:10' },
    { _id: 'shw_interstellar_1', eventId: 'evt_interstellar', screenName: 'IMAX 70mm Special Auditorium', date: today, startTime: '20:30', endTime: '23:20' },
    { _id: 'shw_interstellar_2', eventId: 'evt_interstellar', screenName: 'IMAX 70mm Special Auditorium', date: tomorrow, startTime: '17:00', endTime: '19:50' },
    { _id: 'shw_coldplay_1', eventId: 'evt_coldplay', screenName: 'Main Stadium Arena & VIP Lounge', date: tomorrow, startTime: '18:00', endTime: '21:15' },
    { _id: 'shw_coldplay_2', eventId: 'evt_coldplay', screenName: 'Main Stadium Arena & VIP Lounge', date: dayAfter, startTime: '18:00', endTime: '21:15' },
    { _id: 'shw_diljit_1', eventId: 'evt_diljit', screenName: 'Grand Outdoor Stadium Arena', date: tomorrow, startTime: '19:00', endTime: '22:00' },
    { _id: 'shw_diljit_2', eventId: 'evt_diljit', screenName: 'Grand Outdoor Stadium Arena', date: dayAfter, startTime: '19:00', endTime: '22:00' },
    { _id: 'shw_arijit_1', eventId: 'evt_arijit', screenName: 'Symphony Central Stage', date: tomorrow, startTime: '18:30', endTime: '22:00' },
    { _id: 'shw_ipl_1', eventId: 'evt_ipl2026', screenName: 'Wankhede Pavilion & Corporate Box', date: today, startTime: '19:30', endTime: '23:30' },
    { _id: 'shw_ind_aus_1', eventId: 'evt_ind_aus', screenName: 'Club Pavilion & Presidential Gallery', date: dayAfter, startTime: '19:00', endTime: '23:15' },
    { _id: 'shw_zakir_1', eventId: 'evt_zakir', screenName: 'Siri Fort Main Auditorium', date: today, startTime: '20:00', endTime: '22:00' },
    { _id: 'shw_zakir_2', eventId: 'evt_zakir', screenName: 'Siri Fort Main Auditorium', date: tomorrow, startTime: '18:00', endTime: '20:00' },
    { _id: 'shw_mughal_1', eventId: 'evt_mughal', screenName: 'NMACC Grand Theatre Main Tier', date: today, startTime: '19:00', endTime: '21:30' },
    { _id: 'shw_vr_1', eventId: 'evt_cyberverse', screenName: 'Haptic Pod 01 & Spatial Free-Roam Grid', date: today, startTime: '17:30', endTime: '18:45' },
    { _id: 'shw_vr_2', eventId: 'evt_cyberverse', screenName: 'Haptic Pod 02 & Spatial Free-Roam Grid', date: today, startTime: '19:30', endTime: '20:45' },
    { _id: 'shw_sunburn_1', eventId: 'evt_sunburn', screenName: 'Vagator Mainstage & VIP Deck', date: dayAfter, startTime: '16:00', endTime: '00:00' }
  ];

  shows.forEach(shw => dataStore.createShow(shw));

  // 4. Seed Verified Bookings with Cryptographic QR Tickets for Presentation User
  const demoColdplay = dataStore.findEventById('evt_coldplay');
  const showColdplay = dataStore.findShowById('shw_coldplay_1');

  const demoDune = dataStore.findEventById('evt_dune2');
  const showDune = dataStore.findShowById('shw_dune2_2');

  const demoIPL = dataStore.findEventById('evt_ipl2026');
  const showIPL = dataStore.findShowById('shw_ipl_1');

  const demoZakir = dataStore.findEventById('evt_zakir');
  const showZakir = dataStore.findShowById('shw_zakir_1');

  // Booking 1: Coldplay VIP Passes (Active)
  const coldplaySeats = [
    { id: 'A3', row: 'A', col: 3, tier: 'VIP', price: 1500 },
    { id: 'A4', row: 'A', col: 4, tier: 'VIP', price: 1500 }
  ];
  const bkgColdplay = {
    _id: 'bkg_demo_coldplay',
    bookingNumber: 'VNR-COLD-2026-99',
    finalAmount: 3120,
    seats: coldplaySeats
  };
  const qrColdplay = QRService.createTicketPayload(bkgColdplay, demoColdplay, showColdplay);
  const qrColdplayImg = await QRService.generateQRCodeDataUrl(qrColdplay);

  dataStore.createBooking({
    _id: bkgColdplay._id,
    bookingNumber: bkgColdplay.bookingNumber,
    userId: customer._id,
    eventId: demoColdplay._id,
    showId: showColdplay._id,
    seats: coldplaySeats,
    totalAmount: 3000,
    discountAmount: 0,
    convenienceFee: 120,
    finalAmount: 3120,
    paymentDetails: {
      paymentId: 'PAY_RAZORPAY_COLDPLAY_LIVE',
      method: 'UPI (Google Pay)',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    },
    bookingStatus: 'CONFIRMED',
    qrCodeData: qrColdplay,
    qrCodeImage: qrColdplayImg
  });

  // Booking 2: Dune 2 IMAX Laser (Active)
  const duneSeats = [
    { id: 'C5', row: 'C', col: 5, tier: 'PREMIUM', price: 900 },
    { id: 'C6', row: 'C', col: 6, tier: 'PREMIUM', price: 900 }
  ];
  const bkgDune = {
    _id: 'bkg_demo_dune',
    bookingNumber: 'VNR-DUNE-2026-88',
    finalAmount: 1870,
    seats: duneSeats
  };
  const qrDune = QRService.createTicketPayload(bkgDune, demoDune, showDune);
  const qrDuneImg = await QRService.generateQRCodeDataUrl(qrDune);

  dataStore.createBooking({
    _id: bkgDune._id,
    bookingNumber: bkgDune.bookingNumber,
    userId: customer._id,
    eventId: demoDune._id,
    showId: showDune._id,
    seats: duneSeats,
    totalAmount: 1800,
    discountAmount: 0,
    convenienceFee: 70,
    finalAmount: 1870,
    paymentDetails: {
      paymentId: 'PAY_RAZORPAY_DUNE_LASER',
      method: 'Credit Card (Visa Signature)',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    },
    bookingStatus: 'CONFIRMED',
    qrCodeData: qrDune,
    qrCodeImage: qrDuneImg
  });

  // Booking 3: IPL 2026 MI vs CSK Wankhede (Active)
  const iplSeats = [
    { id: 'B1', row: 'B', col: 1, tier: 'VIP', price: 1500 },
    { id: 'B2', row: 'B', col: 2, tier: 'VIP', price: 1500 }
  ];
  const bkgIPL = {
    _id: 'bkg_demo_ipl',
    bookingNumber: 'VNR-IPL-2026-77',
    finalAmount: 3140,
    seats: iplSeats
  };
  const qrIPL = QRService.createTicketPayload(bkgIPL, demoIPL, showIPL);
  const qrIPLImg = await QRService.generateQRCodeDataUrl(qrIPL);

  dataStore.createBooking({
    _id: bkgIPL._id,
    bookingNumber: bkgIPL.bookingNumber,
    userId: customer._id,
    eventId: demoIPL._id,
    showId: showIPL._id,
    seats: iplSeats,
    totalAmount: 3000,
    discountAmount: 0,
    convenienceFee: 140,
    finalAmount: 3140,
    paymentDetails: {
      paymentId: 'PAY_RAZORPAY_IPL_ELCLASICO',
      method: 'UPI (PhonePe)',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    },
    bookingStatus: 'CONFIRMED',
    qrCodeData: qrIPL,
    qrCodeImage: qrIPLImg
  });

  // 5. Rich Verified Reviews
  const sampleReviews = [
    {
      userId: customer._id,
      userName: 'Aarav Sharma',
      userAvatar: customer.avatar,
      eventId: 'evt_dune2',
      rating: 5,
      comment: 'Mind-blowing visuals and Hans Zimmer sound score in IMAX! The Redis seat locking made booking seamless without concurrency collisions.'
    },
    {
      userId: customer._id,
      userName: 'Aarav Sharma',
      userAvatar: customer.avatar,
      eventId: 'evt_ipl2026',
      rating: 5,
      comment: 'Wankhede roar was unbelievable! Secured VIP row B tickets during flash sale smoothly thanks to atomic seat reservation.'
    }
  ];

  sampleReviews.forEach(rev => dataStore.createReview(rev));

  console.log(`✅ [Seed] Success! Seeded ${dataStore.users.length} Users, ${dataStore.events.length} Events, ${dataStore.shows.length} Shows, ${dataStore.bookings.length} Bookings.`);
};
