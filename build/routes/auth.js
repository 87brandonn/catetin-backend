"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../handlers/auth");
const user_1 = __importDefault(require("../controllers/user"));
const body_parser_1 = __importDefault(require("body-parser"));
const router = express_1.default.Router();
router.use(body_parser_1.default.urlencoded({ extended: true }));
router.use(body_parser_1.default.json());
router.get("/", auth_1.getAuth);
router.get('/validate', user_1.default.validateToken);
router.post('/register', user_1.default.register);
router.post('/login', user_1.default.login);
router.get('/get/all', user_1.default.getAllUsers);
exports.default = router;
