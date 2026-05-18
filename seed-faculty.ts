import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const leadership = [
  { 
    id: "director",
    name: "Mr. Mahesh Sharma", 
    role: "Director", 
    image: "/src/assets/images/regenerated_image_1778566923773.jpg",
    bio: "Visionary leader dedicated to providing affordable quality education to every child.",
    type: "leadership",
    order: 1
  },
  { 
    id: "principal",
    name: "Mr. Pradeep Yadav", 
    role: "Principal", 
    image: "/src/assets/images/principal_portrait_1778743944643.png",
    bio: "Advocating for academic excellence and holistic development for over 15 years.",
    type: "leadership",
    order: 2
  },
  { 
    id: "vice-principal",
    name: "Mr. Amit Mishra", 
    role: "Vice Principal", 
    image: "/src/assets/images/regenerated_image_1778563504563.jpg",
    bio: "Focused on student welfare and implementing modern pedagogical techniques.",
    type: "leadership",
    order: 3
  },
];

const teachers = [
  { id: "teacher-1", name: "Mr. Rajesh Singh", role: "Senior Faculty", subject: "Mathematics", image: "/src/assets/images/regenerated_image_1778563820357.jpg", type: "teacher", order: 1 },
  { id: "teacher-2", name: "Ms. Anjali Verma", role: "Coordinator", subject: "Physics", image: "/src/assets/images/regenerated_image_1778563746018.png", type: "teacher", order: 2 },
  { id: "teacher-3", name: "Mr. Sameer Sen", role: "IT Head", subject: "Computer Science", image: "/src/assets/images/regenerated_image_1778563622100.png", type: "teacher", order: 3 },
  { id: "teacher-4", name: "Mrs. Sunita Roy", role: "Senior Faculty", subject: "English & History", image: "/src/assets/images/regenerated_image_1778521395143.png", type: "teacher", order: 4 },
  { id: "teacher-5", name: "Mr. Rahul Singh", role: "Faculty", subject: "Chemistry", image: "/src/assets/images/regenerated_image_1778566337366.png", type: "teacher", order: 5 },
  { id: "teacher-6", name: "Ms. Kavita Devi", role: "Faculty", subject: "Biology", image: "/src/assets/images/student_portrait_7_1778742300151.png", type: "teacher", order: 6 },
];

async function seed() {
  console.log("Seeding faculty data...");
  for (const member of [...leadership, ...teachers]) {
    const { id, ...data } = member;
    await setDoc(doc(db, 'faculty', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    console.log(`Seeded ${member.name}`);
  }
}

seed().then(() => console.log("Done!")).catch(console.error);
