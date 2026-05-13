// Initial data for the application
const filieres = [
  "DD101",
  "DD102",
  "DD201",
  "ID101",
  "ID102",
  "ID201",
  "ID202",
];
const firstNamesMale = [
  "Amine",
  "Youssef",
  "Karim",
  "Omar",
  "Mehdi",
  "Ilyas",
  "Hamza",
  "Ayoub",
  "Hassan",
  "Ali",
  "Othmane",
  "Anass",
  "Bilal",
  "Walid",
  "Reda",
  "Yassine",
];
const firstNamesFemale = [
  "Salma",
  "Fatima",
  "Khadija",
  "Meryem",
  "Hiba",
  "Sara",
  "Noura",
  "Aya",
  "Leila",
  "Sanaa",
  "Kenza",
  "Zineb",
  "Soukaina",
  "Ghita",
  "Asmaa",
];
const lastNames = [
  "Tahiri",
  "Mouhid",
  "Errami",
  "Alami",
  "Bennani",
  "Chraibi",
  "Drissi",
  "El Fassi",
  "Fahmi",
  "Ghazali",
  "Habibi",
  "Idrissi",
  "Jebli",
  "Kabbaj",
  "Lahlou",
  "Mansouri",
  "Naji",
  "Ouazzani",
  "Qasmi",
  "Rami",
  "Sadiqi",
  "Tazi",
  "Yacoubi",
  "Ziani",
  "Ait Ahmed",
  "Belkhayat",
  "Cherkaoui",
  "Daoudi",
  "Essadi",
  "Filali",
  "Benjelloun",
  "El Amrani",
  "Berrada",
  "El Ouazzani",
  "Kettani",
];

const generateStagiaires = () => {
  const stagiaires = [];
  let id = 1;

  // Create a shuffled copy of lastNames to avoid immediate repetition
  let availableLastNames = [...lastNames].sort(() => 0.5 - Math.random());

  filieres.forEach((filiere) => {
    for (let i = 1; i <= 10; i++) {
      const sexe = i % 3 === 0 ? "f" : "m";
      const firstNameList = sexe === "m" ? firstNamesMale : firstNamesFemale;

      // Select random first name based on gender
      const firstName =
        firstNameList[Math.floor(Math.random() * firstNameList.length)];

      // Select last name, reshuffle if we run out
      if (availableLastNames.length === 0) {
        availableLastNames = [...lastNames].sort(() => 0.5 - Math.random());
      }
      const lastName = availableLastNames.pop();

      stagiaires.push({
        id: id++,
        nom: `${firstName} ${lastName}`,
        filiere: filiere,
        sexe: sexe,
      });
    }
  });
  return stagiaires;
};

const initialStagiaires = generateStagiaires();

const generateAbsences = (stagiaires) => {
  const absences = [];
  let id = 1;
  const today = new Date();
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(today.getMonth() - 2);

  const msPerDay = 1000 * 60 * 60 * 24;
  const maxDaysInRange = Math.max(
    1,
    Math.floor((today.getTime() - twoMonthsAgo.getTime()) / msPerDay),
  );

  // Give about 50% of students some absences
  stagiaires.forEach((s) => {
    if (s.id % 2 === 0) {
      const numAbsences = (s.id % 5) + 2;
      for (let j = 0; j < numAbsences; j++) {
        // Generate a date within the last two calendar months
        const absDate = new Date(today);
        // Distribute absences over the range using student ID and loop index
        const daysAgo = (s.id + j * 13) % maxDaysInRange;
        absDate.setDate(today.getDate() - daysAgo);

        const dateStr = absDate.toISOString().split("T")[0];
        const heures = j % 2 === 0 ? 2.5 : 5;
        // Generate mock slots [1] for 2.5h, [1, 2] for 5h
        const slots = heures === 2.5 ? [1] : [1, 2];

        absences.push({
          id: id++,
          idstag: s.id,
          date: dateStr,
          justifie: j % 2 === 0,
          heures,
          slots,
        });
      }
    }
  });
  return absences;
};

const initialAbsences = generateAbsences(initialStagiaires);

export { initialStagiaires, initialAbsences };
