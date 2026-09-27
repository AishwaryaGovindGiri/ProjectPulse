import express from "express";

import {
    createUser,
    getUsers,
    getUserById,
    updateUser,
} from "../controllers/userController.js";

const router = express.Router();


// ======================================================
// USERS
// ======================================================

router.post(
    "/",
    createUser
);

router.get(
    "/",
    getUsers
);

router.get(
    "/:userId",
    getUserById
);

router.patch(
    "/:userId",
    updateUser
);


export default router;