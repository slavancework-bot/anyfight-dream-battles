import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import fightersRouter from "./fighters.js";
import matchupsRouter from "./matchups.js";
import battleRouter from "./battle.js";
import dailyRouter from "./daily.js";
import ttsRouter from "./tts.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fightersRouter);
router.use(matchupsRouter);
router.use(battleRouter);
router.use(dailyRouter);
router.use(ttsRouter);

export default router;
