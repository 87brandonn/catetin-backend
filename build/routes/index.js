"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const auth_2 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("../controllers/user"));
const routes = express_1.default.Router();
routes.use("/auth", auth_2.default);
auth_1.default.get('/validate', user_1.default.validateToken);
auth_1.default.post('/register', user_1.default.register);
auth_1.default.post('/login', user_1.default.login);
auth_1.default.get('/get/all', user_1.default.getAllUsers);
exports.default = routes;
