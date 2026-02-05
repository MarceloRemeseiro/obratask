import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, password: string): Promise<boolean> {
    const adminUser = this.configService.get<string>('ADMIN_USER');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    return username === adminUser && password === adminPassword;
  }

  async login(username: string, password: string) {
    const isValid = await this.validateUser(username, password);
    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { username, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
