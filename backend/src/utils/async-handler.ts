import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
  const asyncRouteHandler = handler as AsyncRequestHandler;

  return (req, res, next) => {
    void Promise.resolve(asyncRouteHandler(req, res, next)).catch(next);
  };
};
