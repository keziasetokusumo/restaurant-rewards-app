import { Restaurant } from '../types';

export const JAKARTA_AREA_SUGGESTIONS = [
  'Kemang', 'Cipete', 'Senayan', 'Menteng', 'Kebon Sirih',
  'SCBD', 'Sudirman', 'Kuningan', 'Tebet', 'Mampang',
  'Kelapa Gading', 'Pantai Indah Kapuk', 'Pluit', 'Cikini',
  'Gandaria', 'Pondok Indah', 'Kebayoran Baru', 'Blok M',
  'Glodok', 'Mangga Besar', 'Tomang', 'Grogol',
];

export const JAKARTA_AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  Kemang: { lat: -6.261, lng: 106.810 },
  Cipete: { lat: -6.274, lng: 106.798 },
  Senayan: { lat: -6.223, lng: 106.799 },
  Menteng: { lat: -6.193, lng: 106.833 },
  'Kebon Sirih': { lat: -6.188, lng: 106.830 },
  SCBD: { lat: -6.224, lng: 106.808 },
  Sudirman: { lat: -6.210, lng: 106.822 },
  Kuningan: { lat: -6.230, lng: 106.830 },
  Tebet: { lat: -6.240, lng: 106.855 },
  Mampang: { lat: -6.255, lng: 106.832 },
  'Kelapa Gading': { lat: -6.157, lng: 106.905 },
  'Pantai Indah Kapuk': { lat: -6.108, lng: 106.742 },
  Pluit: { lat: -6.119, lng: 106.793 },
  Cikini: { lat: -6.200, lng: 106.846 },
  Gandaria: { lat: -6.253, lng: 106.790 },
  'Pondok Indah': { lat: -6.277, lng: 106.782 },
  'Kebayoran Baru': { lat: -6.244, lng: 106.798 },
  'Blok M': { lat: -6.244, lng: 106.799 },
  Glodok: { lat: -6.148, lng: 106.816 },
  'Mangga Besar': { lat: -6.145, lng: 106.815 },
  Tomang: { lat: -6.181, lng: 106.791 },
  Grogol: { lat: -6.166, lng: 106.793 },
};

const MOCK: Restaurant[] = [
  {
    id: 'r1',
    name: 'Warung Sambal Ijo',
    cuisine: 'Padang',
    area: 'Kemang',
    distanceKm: 0.8,
    rating: 4.7,
    priceLevel: 2,
    imageUrl: '',
    isNewToUser: true,
    rewardRate: 5,
    lat: -6.2615,
    lng: 106.8106,
    reviewCount: 847,
    description:
      'Authentic Padang cooking by a Minang family since 1998. Famous for vibrant sambal ijo and slow-cooked rendang that melts off the bone.',
    address: 'Jl. Kemang Raya No. 12, Kemang, Jakarta Selatan',
    hasReservations: true,
    hours: { weekdays: '11:00–22:00', weekends: '10:00–23:00' },
    tags: ['Halal', 'Dine-in', 'Takeaway', 'Parking'],
    menuHighlights: [
      { id: 'r1_m1', name: 'Rendang Daging', description: 'Slow-braised beef in rich coconut spice paste', priceIdr: 45000, isPopular: true },
      { id: 'r1_m2', name: 'Sambal Ijo Ayam', description: 'Grilled chicken with house green chilli sauce', priceIdr: 38000, isPopular: true },
      { id: 'r1_m3', name: 'Paru Goreng', description: 'Crispy fried lung seasoned with Minang spices', priceIdr: 28000 },
      { id: 'r1_m4', name: 'Gulai Kepala Ikan', description: 'Fish head in a rich, turmeric coconut curry', priceIdr: 52000 },
    ],
    photos: [
      { id: 'r1_p1', emoji: '🍛', bg: '#A84E2A' },
      { id: 'r1_p2', emoji: '🌶️', bg: '#8C2A10' },
      { id: 'r1_p3', emoji: '🍚', bg: '#C47840' },
      { id: 'r1_p4', emoji: '🥩', bg: '#7A3018' },
      { id: 'r1_p5', emoji: '🐟', bg: '#5A5A20' },
    ],
    reviewHighlights: [
      { id: 'r1_r1', author: 'Ahmad R.', rating: 5.0, text: 'Rendangnya LUAR BIASA. Daging empuk banget, bumbunya meresap sempurna. Ini Padang terbaik di Kemang!' },
      { id: 'r1_r2', author: 'Siti N.', rating: 4.5, text: 'Sambal ijo-nya beda dari yang lain — segar dan nendang tapi nggak terlalu pedas. Porsinya juga besar, puas banget.' },
      { id: 'r1_r3', author: 'Budi P.', rating: 4.8, text: 'Nasi Padang paling authentic di Jakarta Selatan. Ibu penjualnya ramah dan sudah kenal pelanggan satu per satu.' },
    ],
  },
  {
    id: 'r2',
    name: 'Kopi Tuku Corner',
    cuisine: 'Coffee & Snacks',
    area: 'Cipete',
    distanceKm: 1.2,
    rating: 4.6,
    priceLevel: 1,
    imageUrl: '',
    isNewToUser: true,
    rewardRate: 8,
    lat: -6.2742,
    lng: 106.7983,
    reviewCount: 1243,
    description:
      'Neighbourhood coffee gem started by two university friends. Known for kopi susu brewed with brown sugar and a hint of coconut milk.',
    address: 'Jl. Cipete Raya No. 78, Cipete, Jakarta Selatan',
    whatsappNumber: '6281234567892',
    hours: { weekdays: '07:00–22:00', weekends: '07:00–23:00' },
    tags: ['WiFi', 'Outdoor seating', 'Takeaway', 'Halal'],
    menuHighlights: [
      { id: 'r2_m1', name: 'Kopi Susu Andaliman', description: 'Cold brew with coconut milk and brown sugar', priceIdr: 28000, isPopular: true },
      { id: 'r2_m2', name: 'Pisang Bakar Karamel', description: 'Caramelised banana on thick-cut toast', priceIdr: 22000, isPopular: true },
      { id: 'r2_m3', name: 'Es Teh Tarik', description: 'Pulled milk tea poured over ice', priceIdr: 18000 },
      { id: 'r2_m4', name: 'Roti Selai Kaya', description: 'Toast with house-made pandan coconut jam', priceIdr: 19000 },
    ],
    photos: [
      { id: 'r2_p1', emoji: '☕', bg: '#6B4C2F' },
      { id: 'r2_p2', emoji: '🍌', bg: '#B89020' },
      { id: 'r2_p3', emoji: '🍞', bg: '#A07830' },
      { id: 'r2_p4', emoji: '🧋', bg: '#503820' },
      { id: 'r2_p5', emoji: '🍵', bg: '#3A5030' },
    ],
    reviewHighlights: [
      { id: 'r2_r1', author: 'Maya L.', rating: 5.0, text: 'Kopi susu-nya bikin nagih! Sudah jadi tempat nongkrong langganan saya seminggu 3x. WiFi kencang juga.' },
      { id: 'r2_r2', author: 'Rizky A.', rating: 4.5, text: 'Tempatnya cozy banget, pisang bakar karamelnya enak parah. Value for money yang luar biasa.' },
      { id: 'r2_r3', author: 'Dewi S.', rating: 4.7, text: 'Hidden gem di Cipete. Datang pagi-pagi, masih sepi dan kopinya fresh banget. Biji kopinya pilihan.' },
    ],
  },
  {
    id: 'r3',
    name: 'Sate Khas Senayan',
    cuisine: 'Indonesian',
    area: 'Senayan',
    distanceKm: 2.1,
    rating: 4.5,
    priceLevel: 3,
    imageUrl: '',
    isNewToUser: false,
    rewardRate: 4,
    lat: -6.2234,
    lng: 106.7994,
    reviewCount: 2156,
    description:
      'A Jakarta institution since 1974. Chicken and lamb sate grilled low and slow over coconut shell charcoal — the only way it should be done.',
    address: 'Jl. Senayan No. 55, Senayan, Jakarta Pusat',
    hasReservations: true,
    hours: { weekdays: '11:00–21:00', weekends: '10:00–21:00' },
    tags: ['Halal', 'Dine-in', 'Group friendly', 'Parking'],
    menuHighlights: [
      { id: 'r3_m1', name: 'Sate Ayam (10)', description: 'Chicken sate with kacang sauce, 10 skewers', priceIdr: 55000, isPopular: true },
      { id: 'r3_m2', name: 'Sate Kambing (10)', description: 'Lamb sate, extra tender, 10 skewers', priceIdr: 68000, isPopular: true },
      { id: 'r3_m3', name: 'Lontong Sayur', description: 'Rice cake in vegetable coconut milk broth', priceIdr: 35000 },
      { id: 'r3_m4', name: 'Soto Ayam', description: 'Clear turmeric chicken broth with vermicelli', priceIdr: 42000 },
    ],
    photos: [
      { id: 'r3_p1', emoji: '🍢', bg: '#9E622A' },
      { id: 'r3_p2', emoji: '🔥', bg: '#7A2800' },
      { id: 'r3_p3', emoji: '🥜', bg: '#8A6020' },
      { id: 'r3_p4', emoji: '🍲', bg: '#6A3A10' },
      { id: 'r3_p5', emoji: '🌿', bg: '#3A5A30' },
    ],
    reviewHighlights: [
      { id: 'r3_r1', author: 'Hendra W.', rating: 5.0, text: 'Sudah langganan sejak 2005. Kualitasnya konsisten dan sate kambingnya selalu top. Ini benchmark sate di Jakarta.' },
      { id: 'r3_r2', author: 'Linda K.', rating: 4.5, text: 'Legendaris memang. Arang batok kelapa bikin sate-nya beda dari yang pakai arang biasa — ada aroma smoky yang khas.' },
      { id: 'r3_r3', author: 'Arif M.', rating: 4.6, text: 'Soto ayamnya underrated banget. Kuahnya bening tapi gurih parah. Wajib coba kalau ke sini.' },
    ],
  },
  {
    id: 'r4',
    name: 'Bakmi Gang Kelinci',
    cuisine: 'Noodles',
    area: 'Menteng',
    distanceKm: 2.6,
    rating: 4.8,
    priceLevel: 2,
    imageUrl: '',
    isNewToUser: true,
    rewardRate: 6,
    lat: -6.1925,
    lng: 106.8332,
    reviewCount: 988,
    description:
      'Legendary Betawi noodle spot from the old Chinese-Indonesian gang in Menteng. Springy handmade noodles wok-fried to order since the 1970s.',
    address: 'Gang Kelinci No. 1, Menteng, Jakarta Pusat',
    whatsappNumber: '6281234567894',
    hours: { weekdays: '10:00–20:00', weekends: '09:00–20:00' },
    tags: ['Cash friendly', 'Takeaway', 'Dine-in'],
    menuHighlights: [
      { id: 'r4_m1', name: 'Bakmi Goreng Special', description: 'Wok-fried noodles with pork cracklings and egg', priceIdr: 45000, isPopular: true },
      { id: 'r4_m2', name: 'Bakmi Kuah Ayam', description: 'Handmade noodle soup with braised chicken', priceIdr: 42000, isPopular: true },
      { id: 'r4_m3', name: 'Pangsit Goreng (8)', description: 'Crispy fried wontons, 8 pieces', priceIdr: 28000 },
      { id: 'r4_m4', name: 'Es Jeruk Peras', description: 'Freshly squeezed orange juice over ice', priceIdr: 18000 },
    ],
    photos: [
      { id: 'r4_p1', emoji: '🍜', bg: '#A87220' },
      { id: 'r4_p2', emoji: '🥟', bg: '#C08040' },
      { id: 'r4_p3', emoji: '🍳', bg: '#906030' },
      { id: 'r4_p4', emoji: '🧅', bg: '#7A5020' },
      { id: 'r4_p5', emoji: '🍊', bg: '#C06820' },
    ],
    reviewHighlights: [
      { id: 'r4_r1', author: 'Joni S.', rating: 5.0, text: 'Bakmi goreng special-nya mantap! Mienya kenyal banget karena dibuat sendiri. Nggak ada yang bisa menandingi.' },
      { id: 'r4_r2', author: 'Claudia T.', rating: 4.7, text: 'Antriannya selalu panjang tapi worth it banget. Ini bakmi terenak yang pernah saya makan di Jakarta, titik.' },
      { id: 'r4_r3', author: 'Patrick L.', rating: 4.8, text: 'Authentic banget. Rasanya nggak berubah sejak pertama kali ke sini 10 tahun lalu. Kualitas selalu terjaga.' },
    ],
  },
  {
    id: 'r5',
    name: 'Nasi Goreng Kambing Kebon Sirih',
    cuisine: 'Street Food',
    area: 'Kebon Sirih',
    distanceKm: 3.0,
    rating: 4.4,
    priceLevel: 1,
    imageUrl: '',
    isNewToUser: false,
    rewardRate: 7,
    lat: -6.1880,
    lng: 106.8302,
    reviewCount: 567,
    description:
      "Legendary late-night cart turned permanent spot. Pak Udin's nasi goreng kambing has been feeding Jakarta night owls since 1985.",
    address: 'Jl. Kebon Sirih Timur No. 12, Kebon Sirih, Jakarta Pusat',
    whatsappNumber: '6281234567895',
    hours: { weekdays: '17:00–01:00', weekends: '17:00–02:00' },
    tags: ['Halal', 'Late night', 'Takeaway', 'Outdoor'],
    menuHighlights: [
      { id: 'r5_m1', name: 'Nasi Goreng Kambing', description: 'Wok-fried rice with spiced young goat meat', priceIdr: 48000, isPopular: true },
      { id: 'r5_m2', name: 'Nasi Goreng Ayam', description: 'Classic fried rice with chicken and pickles', priceIdr: 38000, isPopular: true },
      { id: 'r5_m3', name: 'Sate Kambing Muda (5)', description: 'Young goat sate, 5 skewers', priceIdr: 45000 },
      { id: 'r5_m4', name: 'Es Kelapa Muda', description: 'Fresh young coconut water with coconut meat', priceIdr: 20000 },
    ],
    photos: [
      { id: 'r5_p1', emoji: '🍳', bg: '#3D6B45' },
      { id: 'r5_p2', emoji: '🍚', bg: '#4A5835' },
      { id: 'r5_p3', emoji: '🥩', bg: '#5A3C20' },
      { id: 'r5_p4', emoji: '🌙', bg: '#2A3848' },
      { id: 'r5_p5', emoji: '🥥', bg: '#4A6A30' },
    ],
    reviewHighlights: [
      { id: 'r5_r1', author: 'Farhan R.', rating: 5.0, text: 'Makan malam terbaik di Jakarta! Nasi goreng kambingnya harum, bumbunya bold, dan porsinya besar. Wajib coba!' },
      { id: 'r5_r2', author: 'Yuki P.', rating: 4.4, text: 'Buka malam jadi andalan setelah lembur. Sate kambing mudanya empuk banget, bumbunya pas. Pak Udin ramah.' },
      { id: 'r5_r3', author: 'Andri S.', rating: 4.5, text: 'Sudah langganan sejak 2018. Kualitasnya terjaga banget meski sudah terkenal. Harga masih sangat reasonable.' },
    ],
  },
];

export const restaurantsService = {
  async getNearby(): Promise<Restaurant[]> {
    await delay(250);
    return [...MOCK].sort((a, b) => a.distanceKm - b.distanceKm);
  },
  async getNewToUser(): Promise<Restaurant[]> {
    await delay(250);
    return MOCK.filter((r) => r.isNewToUser);
  },
  async getById(id: string): Promise<Restaurant | undefined> {
    await delay(150);
    return MOCK.find((r) => r.id === id);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
