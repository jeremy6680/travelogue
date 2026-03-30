import { Router, type IRouter } from "express";
import healthRouter from "./health";
import postsRouter from "./posts";
import countriesRouter from "./countries";

const router: IRouter = Router();

router.use(healthRouter);
router.use(postsRouter);
router.use(countriesRouter);

export default router;
