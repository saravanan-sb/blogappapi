const mongoose = require("mongoose")

let db = ''
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: true
        });
        console.log('db connected');
    } catch (err) {
        console.log(err.message);
        process.exit(1);
    }
}

module.exports = {
    connectDB: connectDB
}
