const mongoose = require('mongoose');

const connectDB = async () => {
     try {
          const connection = await mongoose.connect(process.env.MONGODB_URI);

          console.log(`connected to Database Successfully`);
     } catch(error) {
          console.error('Database connection failed :');
          console.error(error.message);

          process.exit(1);
     }
};

module.exports = connectDB;