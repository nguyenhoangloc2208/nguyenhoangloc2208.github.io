module.exports = {
  siteTitle: 'Nguyen Hoang Loc | Software Engineer',
  siteDescription:
    'Hoang Loc is an aspiring software engineer with experiences in frontend development, data modeling & visualization',
  siteKeywords:
    'Nguyen Hoang Loc, Hoang Loc, Nguyen, Hoang, Loc, Beru, Beru portfolio, computer science, statistics, data scientist, software engineer, front-end engineer, web developer, javascript, python, vue.js, react.js, html5, css3, scss, node.js, full-stack developer, machine learning, artificial intelligence, data analysis, data visualization, UX/UI design, responsive design, performance optimization, SEO, JAMstack, REST API, MongoDB, Docker, Git, GitHub, agile development',
  siteUrl: 'https://nguyenhoangloc2208.github.io',
  email: 'nguyenhoangloc2208@gmail.com',

  socialMedia: [
    {
      name: 'GitHub',
      url: 'https://github.com/nguyenhoangloc2208',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/nhl_2208',
    },
    {
      name: 'Twitter',
      url: 'https://x.com/locphonevnn1',
    },
    {
      name: 'Linkedin',
      url: 'https://www.linkedin.com/in/nguyenhoangloc2208',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/nii.228/',
    },
    {
      name: 'Zalo',
      url: 'https://zalo.me/0332649498',
    },
  ],

  navLinks: [
    {
      name: 'About',
      url: '/#about',
    },
    {
      name: 'Experience',
      url: '/#jobs',
    },
    {
      name: 'Projects',
      url: '/#projects',
    },
    {
      name: 'Contact',
      url: '/#contact',
    },
  ],

  colors: {
    green: '#64ffda',
    navy: '#0a192f',
    darkNavy: '#020c1b',
  },

  srConfig: (delay = 200, viewFactor = 0.25) => ({
    origin: 'bottom',
    distance: '20px',
    duration: 500,
    delay,
    rotate: { x: 0, y: 0, z: 0 },
    opacity: 0,
    scale: 1,
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    mobile: true,
    reset: false,
    useDelay: 'always',
    viewFactor,
    viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },
  }),
};
