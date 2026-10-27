/* Blooms by Bincy: THE file to edit for the shop.
   Shop details, the bouquets and their prices, the categories, the colour stories and the wedding-date rules all live here.
   After editing, save and refresh the page. Keep the quotes, commas and brackets as they are. */
window.BLOOMS = {
  // WhatsApp number: country code + number, digits only. Example: '919876543210'
  // Leave it empty ('') until it is ready: the WhatsApp buttons still work, the customer just picks who to send to.
  whatsapp: '',
  // How the phone number is shown on the Contact page and footer. Example: '+91 98765 43210'
  phoneDisplay: '',
  email: '',
  instagram: 'blooms_by_bincy',
  place: 'Adimali, Idukki, Kerala',

  // The message a WhatsApp button starts with when the page does not say anything more specific.
  whatsappHello: 'Hello Blooms by Bincy! I would like to ask about a wedding bouquet.',

  /* ---------- wedding dates ----------
     leadDays: how many days ahead a wedding must be booked.
     blockedDates: days you are not taking orders (holidays, fully booked...). Format 'YYYY-MM-DD'.
     (Later the admin page will fill these in from the orders; until then, edit this list.) */
  leadDays: 14,
  blockedDates: [
    // '2026-12-25',
  ],

  /* ---------- the big photos at the top ----------
     The photos fill the whole top of the page and fade from one to the next every few seconds
     (only the first shows if there is one). On phones the photo sits above the heading.
     image:  the photo's name in assets/blooms/photos/. Each photo needs two sizes there, wide like a landscape photo:
             NAME-wide-800.jpg (800 pixels wide) and NAME-wide-1600.jpg (about 1600 wide).
     alt:    a short description for people using screen readers
     focus:  optional, the part of the photo to keep in view when it is cropped, across then down. Example: '60% 40%'
     Only use photos Bincy took or has a licence/permission for. */
  heroSlides: [
    { image: 'sunset-bride', focus: '55% 50%',
      alt: 'A bride in a lace gown holding a cascade bouquet of ivory and blush flowers at sunset' },
    { image: 'sunset-hands', focus: '50% 50%',
      alt: 'A bride and groom holding hands with a bouquet of ivory and dusty blue roses at sunset' }
  ],

  /* ---------- colour stories (the "Shop by colour story" chips) ----------
     id: a short name used by the bouquets below. colours: the little dots, light to dark is fine. */
  colourStories: [
    { id: 'lavender-plum', name: 'Lavender & Plum', colours: ['#A894D0', '#5E3A5B', '#F4EEE2'] },
    { id: 'blush-ivory',   name: 'Blush & Ivory',   colours: ['#E9B9C4', '#F4EEE2', '#9BB08C'] },
    { id: 'all-white',     name: 'All White',       colours: ['#FFFFFF', '#F4EEE2', '#9BB08C'] },
    { id: 'peach-cream',   name: 'Peach & Cream',   colours: ['#EDB99A', '#F3E7CF', '#9BB08C'] },
    { id: 'dusty-blue',    name: 'Dusty Blue',      colours: ['#5B7895', '#BFD0E2', '#FFFFFF'] }
  ],

  /* ---------- categories (the round icons above the bouquets) ----------
     id: used by the bouquets below ('all' shows everything). icon: a file in assets/blooms/icons/. */
  categories: [
    { id: 'all',          name: 'All bouquets', icon: 'cat-all-bouquets.svg' },
    { id: 'cascade',      name: 'Cascade',      icon: 'cat-cascade.svg' },
    { id: 'bridesmaids',  name: 'Bridesmaids',  icon: 'cat-bridesmaids.svg' },
    { id: 'flower-girls', name: 'Flower girls', icon: 'cat-flower-girls.svg' },
    { id: 'baptism',      name: 'Baptism',      icon: 'cat-baptism.svg' },
    { id: 'sets',         name: 'Couples sets', icon: 'cat-couples-sets.svg' }
  ],

  /* ---------- the bouquets ----------
     no:        the number shown on the card ("No. 01")
     id:        a short name with no spaces, used in links
     name:      shown on the card
     category:  one of the category ids above (or 'bridal' / 'round': these show under "All bouquets")
     label:     the word shown after the number, e.g. 'Cascade'
     price:     the "From ₹" price, a plain number
     per:       optional note after the price, e.g. 'each'
     colours:   the dots on the card (any colours)
     stories:   which colour-story chips show this bouquet (ids from colourStories)
     image:     optional photo in assets/blooms/photos/ (leave out to show the drawing and "Photo coming soon")
     illus:     the drawing in assets/blooms/illus/ used when there is no photo
     tag:       optional little label on the photo, e.g. 'Signature'
     featured:  true for the one shown on the big photo at the top */
  products: [
    { no: 1, id: 'lavender-cascade', name: 'The Lavender Cascade', category: 'cascade', label: 'Cascade', price: 3500,
      colours: ['#5E3A5B', '#A894D0', '#F4EEE2', '#E9B9C4', '#9BB08C'], stories: ['lavender-plum'],
      image: 'lavender-cascade-card', tag: 'Signature', featured: true,
      alt: 'The Lavender Cascade: a handmade cascade bouquet with plum and ivory roses, lavender and white dahlias' },
    { no: 2, id: 'ivory-garden-round', name: 'Ivory Garden Round', category: 'round', label: 'Round', price: 2800,
      colours: ['#F4EEE2', '#E9B9C4', '#9BB08C'], stories: ['blush-ivory', 'all-white'], illus: 'ivory-garden-round.svg' },
    { no: 3, id: 'blush-romance-bridal', name: 'Blush Romance Bridal', category: 'bridal', label: 'Bridal', price: 3200,
      colours: ['#E9B9C4', '#C98E9B', '#F4EEE2', '#9BB08C'], stories: ['blush-ivory'], illus: 'blush-romance-bridal.svg' },
    { no: 4, id: 'bridesmaid-posy-trio', name: 'Bridesmaid Posy Trio', category: 'bridesmaids', label: 'Bridesmaids', price: 900, per: 'each',
      colours: ['#A894D0', '#F4EEE2', '#9BB08C'], stories: ['lavender-plum'], illus: 'bridesmaid-posy-trio.svg' },
    { no: 5, id: 'little-bloom-basket', name: 'Little Bloom Basket', category: 'flower-girls', label: 'Flower girls', price: 700,
      colours: ['#E9B9C4', '#A894D0', '#F3E7CF'], stories: ['blush-ivory', 'peach-cream'], illus: 'little-bloom-basket.svg' },
    { no: 6, id: 'bride-and-groom-set', name: 'Bride & Groom Set', category: 'sets', label: 'Sets', price: 3900,
      colours: ['#F4EEE2', '#5E3A5B', '#9BB08C'], stories: ['lavender-plum', 'all-white'], illus: 'bride-and-groom-set.svg' },
    { no: 7, id: 'baptism-blessing-set', name: 'Baptism Blessing Set', category: 'baptism', label: 'Baptism', price: 1500,
      colours: ['#FFFFFF', '#BFD0E2', '#9BB08C'], stories: ['all-white', 'dusty-blue'], illus: 'baptism-blessing-set.svg' },
    { no: 8, id: 'dusty-blue-cascade', name: 'Dusty Blue Cascade', category: 'cascade', label: 'Cascade', price: 3500,
      colours: ['#5B7895', '#BFD0E2', '#FFFFFF', '#9BB08C'], stories: ['dusty-blue'], illus: 'dusty-blue-cascade.svg' }
  ]
};
