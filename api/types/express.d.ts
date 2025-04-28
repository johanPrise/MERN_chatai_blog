import { Request, Response } from 'express';

// Enhanced Request type with all properties
export interface ExtendedRequest extends Request {
  body: any;
  params: any;
  query: any;
  file?: any; // Add file property for multer

}

// Enhanced Response type with all properties
export interface ExtendedResponse extends Response {
  status(code: number): ExtendedResponse;
  json(body: any): ExtendedResponse;
  send(body: any): ExtendedResponse;
}

// Auth request with user property
export interface AuthRequest extends ExtendedRequest {
  user: {
    id: string;
    role?: string;
  };
}
