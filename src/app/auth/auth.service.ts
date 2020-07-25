import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { User } from './user.model';

export interface AuthResponseData {
    idToken: string;
    email: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    registered?: boolean;
}

@Injectable({providedIn: 'root'})
export class AuthService {
    // Create & Store User Data
    user = new BehaviorSubject<User>(null);

    constructor(private http: HttpClient){
    }

    // SignUp Request
    signUp(email: string, password: string) {
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyB_pII61xKxPFplXZE5zLj6bT7cp7o9epk',
            {
                email: email,
                password: password,
                returnSecureToken: true
            })
            .pipe(catchError(this.handleError), 
                // Emit currently logged in User Data 
                tap( resData => {
                    this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
                })
            );
    }

    // Login Request
    login(email: string,password: string){
        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyB_pII61xKxPFplXZE5zLj6bT7cp7o9epk',
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(catchError(this.handleError),
            // Emit currently logged in User Data
            tap( resData => {
                this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn);
            })
        );
    }

    // Handling User data
    private handleAuthentication(email: string, userId: string, token: string, expiresIn: number){
        const expirationDate = new Date(new Date().getTime() + expiresIn * 1000);
        const user = new User(email, userId, token, expirationDate);
        this.user.next(user);
    }

    // Error Handling Logic
    private handleError(errorRes: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
                if (!errorRes.error || !errorRes.error.error){
                    return throwError(errorMessage);
                }
                switch (errorRes.error.error.message){
                    case 'EMAIL_EXISTS': errorMessage = 'This Email Already Exists!';
                        break;
                    case 'EMAIL_NOT_FOUND': errorMessage = 'Email ID not registered';
                        break;
                    case 'INVALID_PASSWORD': errorMessage = 'Entered Password was Incorrect';
                        break;
                }
                return throwError(errorMessage);
    }

}