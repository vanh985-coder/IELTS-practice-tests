import { Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/Register-dto';
import { VerifyOTPDto } from './dto/Verify-otp';
@Controller('auth')
export class AuthController {
    constructor (private authService : AuthService){}
    @Post('register')
    async Register(@Body() dto : RegisterDto){
        this.authService.register(dto)
    }
    async VerifyOTP(@Body() dto : VerifyOTPDto) {
        this.authService.VerifyOTP(dto)
    }

}
