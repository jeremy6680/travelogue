import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import tripsRouter from "./trips";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(tripsRouter);

export default router;
