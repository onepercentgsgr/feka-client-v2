import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDfNw4ijACfBEI3VQVqwIpbw6MgnCkAnk",
  authDomain: "app.feka.click",
  projectId: "audit-onepercent-31ed4",
  storageBucket: "audit-onepercent-31ed4.firebasestorage.app",
  messagingSenderId: "847007993126",
  appId: "1:847007993126:web:d10e21b57f298b3e9b45e7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
