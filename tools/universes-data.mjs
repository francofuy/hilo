// Universos curados de Hilo: qué títulos tiene cada uno, en orden de la historia.
// Los usa tools/build-universes.mjs, que los busca en TMDB y escribe data/universes.json y data/orders.json.
//
// Un título puede estar en varios universos (p. ej. Deadpool & Wolverine, en Marvel y en X-Men): así se ven las conexiones entre mundos.
//
// [tipo, búsqueda en inglés, año de estreno, opciones]
// opciones: texto (nota que se ve en el título) u objeto:
//   rl: nota corta · role: main | sequel | prequel | spinoff | parallel | anthology | epilogue · note: aclaración de la línea de tiempo
//   id: id de TMDB, si la búsqueda no lo encuentra
// order: { rec: 'release' | 'story', release: { why }, story: { why } }. Sin `story`, solo se ofrece el orden de estreno.
const m = (q, y, o) => ['movie', q, y, o];
const t = (q, y, o) => ['tv', q, y, o];
const R = (role, note) => ({ role, note });
// O: título opcional. Está en el universo, pero no hace falta verlo para seguir la historia principal: el plan de "Hoy toca" lo deja afuera si no lo empezaste.
const O = (note, role) => ({ note, role, opt: true });

export const UNIVERSES = [
  { id: 'marvel', title: 'Marvel', sub: 'Camino a Avengers: Doomsday', modes: true,
    items: [
    m('Captain America: The First Avenger', 2011), t('Agent Carter', 2015), m('Captain Marvel', 2019),
    m('Iron Man', 2008), m('Iron Man 2', 2010), m('The Incredible Hulk', 2008), m('Thor', 2011),
    m('The Avengers', 2012), m('Thor: The Dark World', 2013), m('Iron Man 3', 2013),
    m('Captain America: The Winter Soldier', 2014), m('Guardians of the Galaxy', 2014),
    m('Guardians of the Galaxy Vol. 2', 2017), m('Avengers: Age of Ultron', 2015),
    // series de Marvel Television (ABC, Netflix y Hulu): pasan en el mismo mundo, pero su conexión con las películas es más suelta
    t("Marvel's Agents of S.H.I.E.L.D.", 2013, O('Se estrenó en ABC. Cruza hechos de las películas, sobre todo de Capitán América: El Soldado del Invierno.', 'parallel')),
    t("Marvel's Daredevil", 2015, O('Se estrenó en Netflix. Ocurre en Nueva York, después de la Batalla de Nueva York de Los Vengadores.', 'parallel')),
    t("Marvel's Jessica Jones", 2015, O('Se estrenó en Netflix, en el mismo Nueva York que Daredevil.', 'parallel')),
    t("Marvel's Luke Cage", 2016, O('Se estrenó en Netflix, en Harlem.', 'parallel')),
    t("Marvel's Iron Fist", 2017, O('Se estrenó en Netflix.', 'parallel')),
    t("Marvel's The Defenders", 2017, O('Reúne a Daredevil, Jessica Jones, Luke Cage y Iron Fist. Conviene verla después de sus series.', 'parallel')),
    t("Marvel's The Punisher", 2017, O('Se estrenó en Netflix. Sigue a un personaje que aparece en Daredevil.', 'parallel')),
    t("Marvel's Inhumans", 2017, O('Se estrenó en ABC y tuvo una sola temporada.', 'parallel')),
    t("Marvel's Runaways", 2017, O('Se estrenó en Hulu.', 'parallel')),
    t("Marvel's Cloak & Dagger", 2018, O('Se estrenó en Freeform.', 'parallel')),
    t('Helstrom', 2020, O('Se estrenó en Hulu y tuvo una sola temporada.', 'parallel')),
    m('Ant-Man', 2015),
    m('Captain America: Civil War', 2016), m('Black Widow', 2021), m('Black Panther', 2018),
    m('Spider-Man: Homecoming', 2017), m('Doctor Strange', 2016), m('Thor: Ragnarok', 2017),
    m('Ant-Man and the Wasp', 2018), m('Avengers: Infinity War', 2018), m('Avengers: Endgame', 2019),
    t('WandaVision', 2021), t('The Falcon and the Winter Soldier', 2021),
    m('Spider-Man: Far From Home', 2019, R('main', 'Ocurre unos ocho meses después de Endgame, aunque se estrenó en 2019.')),
    t('Loki', 2021), t('What If...?', 2021), t('I Am Groot', 2022, O('Cortos animados de Groot.', 'spinoff')),
    m('Shang-Chi and the Legend of the Ten Rings', 2021), m('Eternals', 2021), t('Hawkeye', 2021),
    m('Spider-Man: No Way Home', 2021), t('Moon Knight', 2022), m('Doctor Strange in the Multiverse of Madness', 2022),
    t('Ms. Marvel', 2022), m('Thor: Love and Thunder', 2022), m('Black Panther: Wakanda Forever', 2022),
    m('Werewolf by Night', 2022, O('Especial de Disney+. No tiene un lugar claro en la línea de tiempo.', 'spinoff')),
    m('The Guardians of the Galaxy Holiday Special', 2022, O('Especial navideño de los Guardianes, entre Wakanda Forever y Guardianes 3.', 'spinoff')),
    t('She-Hulk: Attorney at Law', 2022), m('Ant-Man and the Wasp: Quantumania', 2023),
    m('Guardians of the Galaxy Vol. 3', 2023), t('Secret Invasion', 2023), m('The Marvels', 2023),
    t('Echo', 2024), m('Deadpool & Wolverine', 2024, R('main', 'También está en X-Men: continúa la historia de las películas de Fox.')), t('Agatha All Along', 2024),
    t("X-Men '97", 2024, O('Continúa la serie animada de los 90. También está en X-Men.', 'spinoff')),
    m('Captain America: Brave New World', 2025), t('Daredevil: Born Again', 2025, R('sequel', 'Continúa la serie de Netflix: conviene haber visto Daredevil.')), m('Thunderbolts*', 2025),
    t('Ironheart', 2025), m('The Fantastic Four: First Steps', 2025),
    t('Eyes of Wakanda', 2025, O('Serie animada que ocurre en el pasado de Wakanda.', 'spinoff')),
    t('Marvel Zombies', 2025, O('Serie animada que sigue un universo alternativo de What If...?', 'spinoff')),
    t('Your Friendly Neighborhood Spider-Man', 2025, O('Serie animada. También está en Spider-Man.', 'spinoff')),
    t('Wonder Man', 2026), t('VisionQuest', 2026),
    m('The Punisher: One Last Kill', 2026, O('Especial de Disney+ que continúa a The Punisher.', 'sequel')),
    m('Spider-Man: Brand New Day', 2026, R('main', 'También está en Spider-Man.')),
    m('Avengers: Doomsday', 2026), m('Avengers: Secret Wars', 2027), m('Black Panther 3', 2028, R('sequel'))
  ]},

  { id: 'xmen', title: 'X-Men', sub: 'Los mutantes de Fox, hasta Deadpool y Wolverine', modes: false, items: [
    m('X-Men', 2000), m('X2: X-Men United', 2003), m('X-Men: The Last Stand', 2006), m('X-Men Origins: Wolverine', 2009),
    m('X-Men: First Class', 2011), m('The Wolverine', 2013), m('X-Men: Days of Future Past', 2014), m('Deadpool', 2016),
    m('X-Men: Apocalypse', 2016), m('Logan', 2017), m('Deadpool 2', 2018), m('Dark Phoenix', 2019), m('The New Mutants', 2020),
    t('Legion', 2017, 'Serie aparte: no se conecta con las películas'), t('The Gifted', 2017, 'Serie aparte: no se conecta con las películas'),
    m('Deadpool & Wolverine', 2024), t("X-Men '97", 2024, 'Continúa la serie animada de los 90')
  ]},

  { id: 'spiderman', title: 'Spider-Man', sub: 'Todas las versiones, de Raimi al Spider-Verse', modes: false, items: [
    m('Spider-Man', 2002), m('Spider-Man 2', 2004), m('Spider-Man 3', 2007), m('The Amazing Spider-Man', 2012), m('The Amazing Spider-Man 2', 2014),
    m('Spider-Man: Homecoming', 2017, 'Marvel'), m('Spider-Man: Into the Spider-Verse', 2018), m('Venom', 2018),
    m('Spider-Man: Far From Home', 2019, 'Marvel'), m('Venom: Let There Be Carnage', 2021), m('Spider-Man: No Way Home', 2021, 'Marvel: reúne a las tres versiones de acción'),
    m('Morbius', 2022), m('Spider-Man: Across the Spider-Verse', 2023), m('Madame Web', 2024), m('Kraven the Hunter', 2024), m('Venom: The Last Dance', 2024),
    t('Your Friendly Neighborhood Spider-Man', 2025, 'Marvel'), m('Spider-Man: Brand New Day', 2026, 'Marvel'),
    t('Spider-Noir', 2026), m('Spider-Man: Beyond the Spider-Verse', 2027)
  ]},

  { id: 'dc', title: 'DC', sub: 'Del DCEU al nuevo DCU', modes: false, items: [
    m('Man of Steel', 2013), m('Batman v Superman: Dawn of Justice', 2016), m('Suicide Squad', 2016), m('Wonder Woman', 2017), m('Justice League', 2017),
    m('Aquaman', 2018), m('Shazam!', 2019), m('Birds of Prey (and the Fantabulous Emancipation of One Harley Quinn)', 2020), m('Wonder Woman 1984', 2020),
    m("Zack Snyder's Justice League", 2021), m('The Suicide Squad', 2021), t('Peacemaker', 2022), m('Black Adam', 2022), m('Shazam! Fury of the Gods', 2023),
    m('The Flash', 2023), m('Blue Beetle', 2023), m('Aquaman and the Lost Kingdom', 2023),
    t('Creature Commandos', 2024, 'Primer título del nuevo DCU'), m('Superman', 2025, 'Nuevo DCU'), t('Lanterns', 2026, 'Nuevo DCU'), m('Supergirl', 2026, 'Nuevo DCU'), m('Man of Tomorrow', 2027, 'Nuevo DCU')
  ]},

  { id: 'arrowverse', title: 'Arrowverse', sub: 'Las series de DC que se cruzan', modes: false, items: [
    t('Arrow', 2012), t('The Flash', 2014), t('Constantine', 2014, 'Sumada al Arrowverse años después'), t('Supergirl', 2015), t("DC's Legends of Tomorrow", 2016),
    t('Black Lightning', 2018), t('Batwoman', 2019), t('Stargirl', 2020), t('Superman & Lois', 2021)
  ]},

  { id: 'batman', title: 'Batman', sub: 'Cada Batman, su propio mundo', modes: false, items: [
    m('Batman', 1989), m('Batman Returns', 1992), m('Batman Forever', 1995), m('Batman & Robin', 1997),
    m('Batman Begins', 2005), m('The Dark Knight', 2008), m('The Dark Knight Rises', 2012),
    t('Gotham', 2014, 'Serie aparte'), m('Joker', 2019, 'Aparte'), m('The Batman', 2022), t('The Penguin', 2024, 'Continúa The Batman'),
    m('Joker: Folie à Deux', 2024, 'Aparte'), m('The Batman Part II', 2027)
  ]},

  { id: 'starwars', title: 'Star Wars', sub: 'La saga en orden de la historia', modes: true, items: [
    t('The Acolyte', 2024, R('prequel', 'Ocurre unos cien años antes de La amenaza fantasma.')),
    t('Tales of the Jedi', 2022, O('Cortos animados que van del pasado de Dooku a los años de la Guerra de los Clones.', 'anthology')),
    m('Star Wars: Episode I - The Phantom Menace', 1999), m('Star Wars: Episode II - Attack of the Clones', 2002),
    m('Star Wars: The Clone Wars', 2008, R('spinoff', 'Película animada que abre la serie, entre Episodio II y Episodio III.')),
    t('Star Wars: The Clone Wars', 2008),
    m('Star Wars: Episode III - Revenge of the Sith', 2005),
    t('Star Wars: The Bad Batch', 2021), m('Solo: A Star Wars Story', 2018), t('Obi-Wan Kenobi', 2022),
    t('Andor', 2022), m('Rogue One: A Star Wars Story', 2016), t('Star Wars Rebels', 2014),
    t('Tales of the Empire', 2024, O('Cortos animados con Morgan Elsbeth y Barriss Offee.', 'anthology')),
    m('Star Wars', 1977), m('The Empire Strikes Back', 1980), m('Return of the Jedi', 1983),
    t('The Mandalorian', 2019), t('The Book of Boba Fett', 2021), t('Ahsoka', 2023), t('Star Wars: Skeleton Crew', 2024, R('sequel')),
    m('The Mandalorian & Grogu', 2026, R('sequel')),
    t('Star Wars Resistance', 2018, O('Ocurre poco antes de El despertar de la Fuerza.', 'spinoff')),
    m('Star Wars: The Force Awakens', 2015), m('Star Wars: The Last Jedi', 2017), m('Star Wars: The Rise of Skywalker', 2019),
    t('Star Wars: Visions', 2021, O('Cortos de anime de distintos estudios. No tienen lugar en la línea de tiempo.', 'anthology'))
  ]},

  { id: 'hungergames', title: 'Los juegos del hambre', sub: 'Panem, antes y después de Katniss', modes: true,
    order: { rec: 'release',
      release: { why: 'Empezás por Katniss, como se estrenó. Las precuelas cuentan el origen de los Juegos y de Snow, y funcionan mejor si ya conocés el final.' },
      story: { why: 'Empieza 64 años antes de Katniss, con la décima edición de los Juegos, y sigue hacia ella. Sirve para repasar: para empezar, las precuelas te cuentan cosas de la saga que Katniss descubre después.' } },
    items: [
    m('The Hunger Games: The Ballad of Songbirds & Snakes', 2023, R('prequel', 'Ocurre 64 años antes de Los juegos del hambre.')),
    m('The Hunger Games: Sunrise on the Reaping', 2026, R('prequel', 'Ocurre 24 años antes de Los juegos del hambre, con Haymitch.')),
    m('The Hunger Games', 2012, R('main')), m('The Hunger Games: Catching Fire', 2013, R('main')),
    m('The Hunger Games: Mockingjay - Part 1', 2014, R('main')), m('The Hunger Games: Mockingjay - Part 2', 2015, R('main'))
  ]},

  { id: 'twd', title: 'The Walking Dead', sub: 'Series conectadas', modes: false, items: [
    t('The Walking Dead', 2010, 'Serie original'),
    t('Fear the Walking Dead', 2015, 'Compañera: arranca al inicio del brote'),
    t('The Walking Dead: World Beyond', 2020, 'Diez años después del brote'),
    t('Tales of the Walking Dead', 2022, 'Antología'),
    t('The Walking Dead: Dead City', 2023, 'Continuación de la historia'),
    t('The Walking Dead: Daryl Dixon', 2023, 'Continuación de la historia'),
    t('The Walking Dead: The Ones Who Live', 2024, 'Continuación de la historia')
  ]},

  { id: 'breakingbad', title: 'Breaking Bad', sub: 'Albuquerque, antes y después', modes: true, items: [
    t('Better Call Saul', 2015, 'Precuela y continuación'), t('Breaking Bad', 2008, 'Serie original'), m('El Camino: A Breaking Bad Movie', 2019, 'Epílogo')
  ]},
  { id: 'got', title: 'Game of Thrones', sub: 'Westeros en orden de la historia', modes: true, items: [
    t('A Knight of the Seven Kingdoms', 2026), t('House of the Dragon', 2022, 'Precuela'), t('Game of Thrones', 2011, 'Serie original')
  ]},

  { id: 'wizarding', title: 'Mundo Mágico', sub: 'Harry Potter y Animales Fantásticos', modes: true, items: [
    m('Fantastic Beasts and Where to Find Them', 2016), m('Fantastic Beasts: The Crimes of Grindelwald', 2018),
    m('Fantastic Beasts: The Secrets of Dumbledore', 2022),
    m("Harry Potter and the Philosopher's Stone", 2001), m('Harry Potter and the Chamber of Secrets', 2002),
    m('Harry Potter and the Prisoner of Azkaban', 2004), m('Harry Potter and the Goblet of Fire', 2005),
    m('Harry Potter and the Order of the Phoenix', 2007), m('Harry Potter and the Half-Blood Prince', 2009),
    m('Harry Potter and the Deathly Hallows: Part 1', 2010), m('Harry Potter and the Deathly Hallows: Part 2', 2011),
    t('Harry Potter', 2027, R('parallel', 'Serie de HBO: vuelve a contar los libros, sin conexión directa con las películas.'))
  ]},
  { id: 'middleearth', title: 'Tierra Media', sub: 'El Hobbit, El Señor de los Anillos y más', modes: true, items: [
    t('The Lord of the Rings: The Rings of Power', 2022), m('The Hobbit: An Unexpected Journey', 2012),
    m('The Hobbit: The Desolation of Smaug', 2013), m('The Hobbit: The Battle of the Five Armies', 2014),
    m('The Lord of the Rings: The Fellowship of the Ring', 2001), m('The Lord of the Rings: The Two Towers', 2002),
    m('The Lord of the Rings: The Return of the King', 2003), m('The Lord of the Rings: The War of the Rohirrim', 2024),
    m('The Lord of the Rings: The Hunt for Gollum', 2027, R('spinoff', 'Ocurre entre La comunidad del anillo y Las dos torres en la historia de Gollum.'))
  ]},
  { id: 'dune', title: 'Dune', sub: 'Arrakis, de las Bene Gesserit a Paul', modes: true, items: [
    t('Dune: Prophecy', 2024), m('Dune', 2021), m('Dune: Part Two', 2024), m('Dune: Part Three', 2026, R('main')),
    m('Dune', 1984, R('parallel', 'Adaptación de David Lynch: otra versión de la misma novela.')),
    t('Frank Herbert\'s Dune', 2000, R('parallel', 'Miniserie de 2000: otra versión de la misma novela.')),
    t('Frank Herbert\'s Children of Dune', 2003, R('parallel', 'Miniserie que adapta las dos novelas siguientes.'))
  ]},
  { id: 'theboys', title: 'The Boys', sub: 'El universo de Vought', modes: false, items: [
    t('The Boys', 2019), t('The Boys Presents: Diabolical', 2022, R('anthology', 'Antología animada')), t('Gen V', 2023), t('Vought Rising', 2027, R('prequel', 'Precuela'))
  ]},
  { id: 'alien', title: 'Alien', sub: 'Nostromo y todo lo que vino después', modes: true, items: [
    m('Prometheus', 2012), m('Alien: Covenant', 2017), t('Alien: Earth', 2025), m('Alien', 1979),
    m('Alien: Romulus', 2024), m('Aliens', 1986), m('Alien 3', 1992), m('Alien Resurrection', 1997),
    m('AVP: Alien vs. Predator', 2004, R('parallel', 'Cruce con Depredador. También está en Depredador.')),
    m('Aliens vs. Predator: Requiem', 2007, R('parallel', 'Cruce con Depredador. También está en Depredador.'))
  ]},
  { id: 'predator', title: 'Depredador', sub: 'La cacería, de Arnold a Prey', modes: true,
    order: { rec: 'release',
      release: { why: 'Empezás por la película original y seguís como se estrenó. Cada una funciona por su cuenta.' },
      story: { why: 'Prey ocurre en 1719 y es la más antigua. Después sigue la línea de tiempo hacia el futuro. Va bien para repasar, pero cada película se entiende sola.' } },
    items: [
    m('Prey', 2022, R('prequel')), m('Predator: Killer of Killers', 2025, R('anthology')), m('Predator', 1987, R('main')), m('Predator 2', 1990, R('sequel')),
    m('AVP: Alien vs. Predator', 2004, R('parallel', 'Cruce con Alien. También está en Alien.')), m('Aliens vs. Predator: Requiem', 2007, R('parallel', 'Cruce con Alien. También está en Alien.')),
    m('Predators', 2010, R('sequel')), m('The Predator', 2018, R('sequel')), m('Predator: Badlands', 2025, R('sequel'))
  ]},

  { id: 'fastfurious', title: 'Rápidos y Furiosos', sub: 'La familia de Dom, en orden de la historia', modes: true,
    order: { rec: 'release',
      release: { why: 'Se estrenaron en este orden y la historia se fue armando así. La tercera es la que más se ve distinta en la línea de tiempo.' },
      story: { why: 'Tokyo Drift se estrenó tercera, pero ocurre después de Rápidos y Furiosos 6 y su final se resuelve en la siete. Este orden evita confundirte con personajes que reaparecen.' } },
    items: [
    m('The Fast and the Furious', 2001), m('2 Fast 2 Furious', 2003), m('Fast & Furious', 2009), m('Fast Five', 2011), m('Fast & Furious 6', 2013),
    m('The Fast and the Furious: Tokyo Drift', 2006, R('main', 'Se estrenó tercera, pero ocurre después de Rápidos y Furiosos 6.')), m('Furious 7', 2015), m('The Fate of the Furious', 2017),
    m('Hobbs & Shaw', 2019, R('spinoff')), m('F9', 2021), m('Fast X', 2023), t('Fast & Furious Spy Racers', 2019, R('spinoff')),
    m('Fast X: Part 2', 2027)
  ]},

  { id: 'missionimpossible', title: 'Misión: Imposible', sub: 'El equipo de Ethan Hunt', modes: false, items: [
    m('Mission: Impossible', 1996), m('Mission: Impossible II', 2000), m('Mission: Impossible III', 2006), m('Mission: Impossible - Ghost Protocol', 2011),
    m('Mission: Impossible - Rogue Nation', 2015), m('Mission: Impossible - Fallout', 2018), m('Mission: Impossible - Dead Reckoning Part One', 2023), m('Mission: Impossible - The Final Reckoning', 2025)
  ]},

  { id: 'johnwick', title: 'John Wick', sub: 'El mundo de los asesinos', modes: true,
    order: { rec: 'release',
      release: { why: 'Es el orden en que se estrenó. Las películas se van conectando y no te adelanta nada.' },
      story: { why: 'Empieza con la serie The Continental, que ocurre en los años 70, y sigue con las películas. Ballerina ocurre entre la tercera y la cuarta.' } },
    items: [
    t('The Continental: From the World of John Wick', 2023, R('prequel', 'Ocurre en los años 70, mucho antes de John Wick.')),
    m('John Wick', 2014), m('John Wick: Chapter 2', 2017), m('John Wick: Chapter 3 - Parabellum', 2019),
    m('Ballerina', 2025, R('spinoff', 'Ocurre entre John Wick 3 y John Wick 4.')),
    m('John Wick: Chapter 4', 2023)
  ]},

  { id: 'matrix', title: 'Matrix', sub: 'La píldora roja, y Animatrix', modes: false, items: [
    m('The Matrix', 1999), m('The Animatrix', 2003, 'Cortos que explican el origen de la guerra con las máquinas'), m('The Matrix Reloaded', 2003), m('The Matrix Revolutions', 2003), m('The Matrix Resurrections', 2021)
  ]},

  { id: 'terminator', title: 'Terminator', sub: 'Skynet y la resistencia', modes: false, items: [
    m('The Terminator', 1984), m('Terminator 2: Judgment Day', 1991), m('Terminator 3: Rise of the Machines', 2003), t("Terminator: The Sarah Connor Chronicles", 2008, 'Continúa Terminator 2, ignora las dos siguientes'),
    m('Terminator Salvation', 2009), m('Terminator Genisys', 2015, 'Línea alternativa'), m('Terminator: Dark Fate', 2019, 'Continúa Terminator 2'), t('Terminator Zero', 2024, 'Anime')
  ]},

  { id: 'planetapes', title: 'El planeta de los simios', sub: 'Las dos sagas y el reino de César', modes: false, items: [
    m('Planet of the Apes', 1968, 'Saga original'), m('Beneath the Planet of the Apes', 1970, 'Saga original'), m('Escape from the Planet of the Apes', 1971, 'Saga original'),
    m('Conquest of the Planet of the Apes', 1972, 'Saga original'), m('Battle for the Planet of the Apes', 1973, 'Saga original'),
    m('Rise of the Planet of the Apes', 2011, 'Nueva saga'), m('Dawn of the Planet of the Apes', 2014, 'Nueva saga'), m('War for the Planet of the Apes', 2017, 'Nueva saga'),
    m('Kingdom of the Planet of the Apes', 2024, 'Continúa la nueva saga')
  ]},

  { id: 'jurassic', title: 'Jurassic Park', sub: 'Isla Nublar y más allá', modes: true,
    order: { rec: 'release',
      release: { why: 'Es el orden en que se estrenaron. Cada trilogía se entiende mejor siguiéndola de corrido.' },
      story: { why: 'Camp Cretaceous ocurre durante Jurassic World y Chaos Theory se ubica después. Es un buen orden para repasar, aunque Camp Cretaceous se disfruta igual al final.' } },
    items: [
    m('Jurassic Park', 1993), m('The Lost World: Jurassic Park', 1997), m('Jurassic Park III', 2001), m('Jurassic World', 2015),
    t('Jurassic World: Camp Cretaceous', 2020, R('parallel', 'Ocurre durante los hechos de Jurassic World.')), m('Jurassic World: Fallen Kingdom', 2018),
    m('Jurassic World Dominion', 2022), t('Jurassic World: Chaos Theory', 2024, R('sequel', 'Sigue a los chicos de Camp Cretaceous.')), m('Jurassic World Rebirth', 2025)
  ]},

  { id: 'monsterverse', title: 'MonsterVerse', sub: 'Godzilla y Kong', modes: false, items: [
    m('Godzilla', 2014), m('Kong: Skull Island', 2017), m('Godzilla: King of the Monsters', 2019), m('Godzilla vs. Kong', 2021),
    t('Monarch: Legacy of Monsters', 2023), m('Godzilla x Kong: The New Empire', 2024), m('Godzilla x Kong: Supernova', 2027)
  ]},

  { id: 'conjuring', title: 'El Conjuro', sub: 'Los Warren y sus casos', modes: false, items: [
    m('The Conjuring', 2013), m('Annabelle', 2014), m('The Conjuring 2', 2016), m('Annabelle: Creation', 2017), m('The Nun', 2018),
    m('The Curse of La Llorona', 2019), m('Annabelle Comes Home', 2019), m('The Conjuring: The Devil Made Me Do It', 2021), m('The Nun II', 2023), m('The Conjuring: Last Rites', 2025)
  ]},

  { id: 'startrek', title: 'Star Trek', sub: 'Series y películas de la Flota Estelar', modes: false, items: [
    t('Star Trek', 1966), m('Star Trek: The Motion Picture', 1979), m('Star Trek II: The Wrath of Khan', 1982), m('Star Trek III: The Search for Spock', 1984),
    m('Star Trek IV: The Voyage Home', 1986), m('Star Trek V: The Final Frontier', 1989), m('Star Trek VI: The Undiscovered Country', 1991),
    t('Star Trek: The Next Generation', 1987), m('Star Trek Generations', 1994), m('Star Trek: First Contact', 1996), m('Star Trek: Insurrection', 1998), m('Star Trek: Nemesis', 2002),
    t('Star Trek: Deep Space Nine', 1993), t('Star Trek: Voyager', 1995), t('Star Trek: Enterprise', 2001),
    m('Star Trek', 2009, 'Línea de tiempo alternativa'), m('Star Trek Into Darkness', 2013, 'Línea de tiempo alternativa'), m('Star Trek Beyond', 2016, 'Línea de tiempo alternativa'),
    t('Star Trek: Discovery', 2017), t('Star Trek: Picard', 2020), t('Star Trek: Lower Decks', 2020), t('Star Trek: Prodigy', 2021), t('Star Trek: Strange New Worlds', 2022),
    m('Star Trek: Section 31', 2025), t('Star Trek: Starfleet Academy', 2026)
  ]},

  { id: 'pirates', title: 'Piratas del Caribe', sub: 'Jack Sparrow y la Perla Negra', modes: false, items: [
    m('Pirates of the Caribbean: The Curse of the Black Pearl', 2003), m("Pirates of the Caribbean: Dead Man's Chest", 2006), m("Pirates of the Caribbean: At World's End", 2007),
    m('Pirates of the Caribbean: On Stranger Tides', 2011), m("Pirates of the Caribbean: Dead Men Tell No Tales", 2017)
  ]},
  { id: 'indiana', title: 'Indiana Jones', sub: 'El arqueólogo más famoso', modes: true,
    order: { rec: 'release',
      release: { why: 'Es el orden en que se estrenaron y el que mejor funciona: cada película te va contando más del personaje.' },
      story: { why: 'El templo maldito ocurre un año antes de En busca del arca perdida. La serie de jóvenes arranca antes de todas.' } },
    items: [
    t('The Young Indiana Jones Chronicles', 1992, R('prequel', 'Sigue a Indy de niño y joven, antes de las películas.')),
    m('Indiana Jones and the Temple of Doom', 1984, R('prequel', 'Se estrenó segunda, pero ocurre un año antes de En busca del arca perdida.')),
    m('Raiders of the Lost Ark', 1981), m('Indiana Jones and the Last Crusade', 1989), m('Indiana Jones and the Kingdom of the Crystal Skull', 2008), m('Indiana Jones and the Dial of Destiny', 2023)
  ]},
  { id: 'transformers', title: 'Transformers', sub: 'Autobots contra Decepticons', modes: true,
    order: { rec: 'release',
      release: { why: 'Es el orden en que se estrenaron. Las precuelas se aprecian mejor sabiendo cómo termina la historia.' },
      story: { why: 'Empieza con Transformers One, que cuenta cómo Optimus y Megatron eran amigos, y sigue con Bumblebee. Sirve para repasar la línea de tiempo.' } },
    items: [
    m('Transformers One', 2024, R('prequel', 'Cuenta cómo Optimus Prime y Megatron dejaron de ser amigos.')),
    m('Bumblebee', 2018, R('prequel', 'Ocurre en 1987, antes de la primera película.')),
    m('Transformers', 2007), m('Transformers: Revenge of the Fallen', 2009), m('Transformers: Dark of the Moon', 2011), m('Transformers: Age of Extinction', 2014),
    m('Transformers: The Last Knight', 2017), m('Transformers: Rise of the Beasts', 2023)
  ]},

  { id: 'toystory', title: 'Toy Story', sub: 'Woody, Buzz y compañía', modes: false, items: [
    m('Toy Story', 1995), m('Toy Story 2', 1999), m('Toy Story 3', 2010), m('Toy Story 4', 2019), m('Lightyear', 2022, 'Spin-off: la película que vio Andy'), m('Toy Story 5', 2026)
  ]},
  { id: 'shrek', title: 'Shrek', sub: 'Pantano, y el Gato con Botas', modes: false, items: [
    m('Shrek', 2001), m('Shrek 2', 2004), m('Shrek the Third', 2007), m('Shrek Forever After', 2010), m('Puss in Boots', 2011), m('Puss in Boots: The Last Wish', 2022), m('Shrek 5', 2027)
  ]},
  { id: 'dragon', title: 'Cómo entrenar a tu dragón', sub: 'Berk, en animación y en acción real', modes: false, items: [
    m('How to Train Your Dragon', 2010), m('How to Train Your Dragon 2', 2014), m('How to Train Your Dragon: The Hidden World', 2019), m('How to Train Your Dragon', 2025, 'Versión en acción real'), m('How to Train Your Dragon 2', 2027, 'Versión en acción real')
  ]},

  { id: 'avatar', title: 'Avatar', sub: 'Pandora, de James Cameron', modes: false, items: [
    m('Avatar', 2009), m('Avatar: The Way of Water', 2022), m('Avatar: Fire and Ash', 2025), m('Avatar 4', 2029), m('Avatar 5', 2031)
  ]},
  { id: 'airbender', title: 'Avatar: La leyenda de Aang', sub: 'Los cuatro elementos', modes: true,
    order: { rec: 'release',
      release: { why: 'Se estrenó así: primero Aang y después Korra, que ocurre décadas más tarde. Korra da por sabida la historia de Aang.' },
      story: { why: 'Sigue la línea de tiempo: Aang, Korra y lo que viene después. Es la misma historia contada de punta a punta.' } },
    items: [
    t('Avatar: The Last Airbender', 2005, R('main')), t('The Legend of Korra', 2012, R('sequel', 'Ocurre setenta años después de La leyenda de Aang.')),
    t('Avatar: The Last Airbender', 2024, R('parallel', 'Versión en acción real de Netflix de la primera serie.')),
    t('Avatar: Seven Havens', 2026, R('sequel', 'Serie animada: sigue a una nueva generación.'))
  ]},

  { id: 'strangerthings', title: 'Stranger Things', sub: 'Hawkins y el Mundo del Revés', modes: false, items: [
    t('Stranger Things', 2016), t('Stranger Things: Tales From \'85', 2026, 'Serie animada ambientada entre la temporada 2 y la 3')
  ]},
  { id: 'yellowstone', title: 'Yellowstone', sub: 'La familia Dutton, en tres épocas', modes: true,
    order: { rec: 'release',
      release: { why: 'Empezás por Yellowstone, que presenta a los Dutton de hoy, y después las precuelas.' },
      story: { why: 'Sigue la línea de tiempo: 1883, 1923 y después la serie actual. Es el mismo árbol familiar contado hacia adelante.' } },
    items: [
    t('1883', 2021, R('prequel', 'Ocurre en 1883.')), t('1923', 2022, R('prequel', 'Ocurre en 1923.')), t('Yellowstone', 2018, R('main')),
    t('Marshals', 2026, R('sequel', 'Continúa la historia de Kayce Dutton.'))
  ]},
  { id: 'peaky', title: 'Peaky Blinders', sub: 'Los Shelby de Birmingham', modes: false, items: [
    t('Peaky Blinders', 2013), m('Peaky Blinders: The Immortal Man', 2026)
  ]},
  { id: 'dexter', title: 'Dexter', sub: 'El asesino de Miami', modes: true,
    order: { rec: 'release',
      release: { why: 'Es el orden en que se estrenó. Las precuelas conviene verlas después de la serie original.' },
      story: { why: 'Empieza con Original Sin, que ocurre en 1991, y sigue con la serie y sus continuaciones.' } },
    items: [
    t('Dexter: Original Sin', 2024, R('prequel', 'Ocurre en 1991, antes de la serie original.')), t('Dexter', 2006, R('main')), t('Dexter: New Blood', 2021, R('sequel')), t('Dexter: Resurrection', 2025, R('sequel'))
  ]},
  { id: 'moneyheist', title: 'La casa de papel', sub: 'El Profesor y sus atracos', modes: true,
    order: { rec: 'release',
      release: { why: 'Se estrenó así. Berlín tiene más sentido si ya conocés a ese personaje.' },
      story: { why: 'Berlín ocurre antes del atraco a la Fábrica de Moneda. Sirve para repasar, pero conviene verla después de la serie original.' } },
    items: [
    t('Berlin', 2023, R('prequel', 'Ocurre antes de La casa de papel.')), t('Money Heist', 2017, R('main')), t('Money Heist: Korea - Joint Economic Area', 2022, R('parallel', 'Versión coreana: otra historia con el mismo punto de partida.'))
  ]},
  { id: 'narcos', title: 'Narcos', sub: 'Pablo Escobar y los carteles', modes: false, items: [
    t('Narcos', 2015), t('Narcos: Mexico', 2018, 'Continúa la historia en México')
  ]},
  { id: 'vikings', title: 'Vikings', sub: 'Ragnar y lo que vino después', modes: true,
    order: { rec: 'release',
      release: { why: 'Se estrenó así. Valhalla ocurre cien años después y no necesita la serie original, pero se disfruta más con ella.' },
      story: { why: 'Es el mismo orden: Valhalla ocurre un siglo después de Vikings.' } },
    items: [
    t('Vikings', 2013, R('main')), t('Vikings: Valhalla', 2022, R('sequel', 'Ocurre cien años después.'))
  ]},
  { id: 'witcher', title: 'The Witcher', sub: 'El Continente, en serie y en animación', modes: true,
    order: { rec: 'release',
      release: { why: 'Se estrenó así. Los títulos que se salen de la línea de tiempo principal se disfrutan igual con la serie ya vista.' },
      story: { why: 'Blood Origin ocurre mil doscientos años antes y Nightmare of the Wolf cuenta la juventud de Vesemir. Sirve para repasar.' } },
    items: [
    t('The Witcher: Blood Origin', 2022, R('prequel', 'Ocurre unos mil doscientos años antes de la serie.')),
    m('The Witcher: Nightmare of the Wolf', 2021, R('prequel', 'Cuenta la juventud de Vesemir, antes de Geralt.')),
    t('The Witcher', 2019, R('main')), m('The Witcher: Sirens of the Deep', 2025, R('spinoff'))
  ]},

  { id: 'karatekid', title: 'Karate Kid', sub: 'De Daniel LaRusso a Cobra Kai', modes: false, items: [
    m('The Karate Kid', 1984), m('The Karate Kid Part II', 1986), m('The Karate Kid Part III', 1989), m('The Next Karate Kid', 1994, 'Aparte'), m('The Karate Kid', 2010, 'Versión nueva: otra historia'),
    t('Cobra Kai', 2018, 'Continúa las tres primeras películas'), m('Karate Kid: Legends', 2025, 'Reúne a Cobra Kai con la película de 2010')
  ]},
  { id: 'rocky', title: 'Rocky', sub: 'De Philadelphia a Adonis Creed', modes: false, items: [
    m('Rocky', 1976), m('Rocky II', 1979), m('Rocky III', 1982), m('Rocky IV', 1985), m('Rocky V', 1990), m('Rocky Balboa', 2006), m('Creed', 2015, 'Continúa la saga'), m('Creed II', 2018), m('Creed III', 2023)
  ]},
  { id: 'chucky', title: 'Chucky', sub: 'La muñeca asesina', modes: false, items: [
    m("Child's Play", 1988), m("Child's Play 2", 1990), m("Child's Play 3", 1991), m('Bride of Chucky', 1998), m('Seed of Chucky', 2004),
    m('Curse of Chucky', 2013), m('Cult of Chucky', 2017), t('Chucky', 2021, 'Continúa las películas')
  ]},
  { id: 'hannibal', title: 'Hannibal Lecter', sub: 'El doctor, en cine y en serie', modes: false, items: [
    m('Manhunter', 1986), m('The Silence of the Lambs', 1991), m('Hannibal', 2001), m('Red Dragon', 2002), m('Hannibal Rising', 2007), t('Hannibal', 2013, 'Serie aparte'), t('Clarice', 2021, 'Continúa El silencio de los inocentes')
  ]},
  { id: 'purge', title: 'La noche de las bestias', sub: 'The Purge', modes: false, items: [
    m('The Purge', 2013), m('The Purge: Anarchy', 2014), m('The Purge: Election Year', 2016), m('The First Purge', 2018, 'Precuela'), t('The Purge', 2018, 'Serie'), m('The Forever Purge', 2021)
  ]},
  { id: 'despicable', title: 'Mi Villano Favorito', sub: 'Gru y los Minions', modes: false, items: [
    m('Despicable Me', 2010), m('Despicable Me 2', 2013), m('Minions', 2015, 'Precuela'), m('Despicable Me 3', 2017), m('Minions: The Rise of Gru', 2022, 'Precuela'), m('Despicable Me 4', 2024), m('Minions 3', 2027)
  ]}
];
