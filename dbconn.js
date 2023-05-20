const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        mongoose.connect(process.env.MONGOURI, {
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
