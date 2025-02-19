require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createUser() {
    try {
        const username = await question('Enter username: ');
        const email = await question('Enter email: ');
        const password = await question('Enter password: ');
        const role = await question('Enter role (admin/user) [default: user]: ') || 'user';

        const user = new User({
            username,
            email,
            password,
            role
        });

        await user.save();
        console.log('User created successfully!');
        console.log('User details:', {
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('Error creating user:', error.message);
    }
}

async function listUsers() {
    try {
        const users = await User.find({}).select('-password');
        console.log('\nCurrent Users:');
        users.forEach(user => {
            console.log(`
ID: ${user._id}
Username: ${user.username}
Email: ${user.email}
Role: ${user.role}
Created: ${user.createdAt}
-------------------`);
        });
    } catch (error) {
        console.error('Error listing users:', error.message);
    }
}

async function modifyUser() {
    try {
        const userId = await question('Enter user ID to modify: ');
        const user = await User.findById(userId);
        
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('\nCurrent user details:', {
            username: user.username,
            email: user.email,
            role: user.role
        });

        const newUsername = await question('Enter new username (or press enter to skip): ');
        const newEmail = await question('Enter new email (or press enter to skip): ');
        const newPassword = await question('Enter new password (or press enter to skip): ');
        const newRole = await question('Enter new role (admin/user) (or press enter to skip): ');

        if (newUsername) user.username = newUsername;
        if (newEmail) user.email = newEmail;
        if (newPassword) user.password = newPassword;
        if (newRole) user.role = newRole;

        await user.save();
        console.log('User updated successfully!');
    } catch (error) {
        console.error('Error modifying user:', error.message);
    }
}

async function deleteUser() {
    try {
        const userId = await question('Enter user ID to delete: ');
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User deleted successfully!');
    } catch (error) {
        console.error('Error deleting user:', error.message);
    }
}

async function main() {
    while (true) {
        console.log('\nUser Management Script');
        console.log('1. Create new user');
        console.log('2. List all users');
        console.log('3. Modify user');
        console.log('4. Delete user');
        console.log('5. Exit');

        const choice = await question('\nEnter your choice (1-5): ');

        switch (choice) {
            case '1':
                await createUser();
                break;
            case '2':
                await listUsers();
                break;
            case '3':
                await modifyUser();
                break;
            case '4':
                await deleteUser();
                break;
            case '5':
                console.log('Goodbye!');
                rl.close();
                process.exit(0);
            default:
                console.log('Invalid choice. Please try again.');
        }
    }
}

main().catch(error => {
    console.error('Script error:', error);
    process.exit(1);
}); 