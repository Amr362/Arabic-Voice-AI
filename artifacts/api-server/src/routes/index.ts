import { Router, type IRouter } from "express";
import healthRouter from "./health";
import voicesRouter from "./voices";
import ttsRouter from "./tts";
import historyRouter from "./history";
import userRouter from "./user";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(voicesRouter);
router.use(ttsRouter);
router.use(historyRouter);
router.use(userRouter);
router.use(adminRouter);

export default router;
