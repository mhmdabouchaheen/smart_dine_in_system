import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

/**
 * Express middleware that validates req.body against a Zod schema.
 * On failure it returns 400 with a structured errors array.
 * On success it replaces req.body with the parsed (and coerced) value.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const formatted = (result.error as any).errors.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }))

      res.status(400).json({
        error: 'Validation failed',
        details: formatted,
      })
      return
    }

    req.body = result.data
    next()
  }
}
