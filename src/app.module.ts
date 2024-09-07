import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { BookmarkModule } from './bookmark/bookmark.module';
import { StatsModule } from './stats/stats.module';

const envFilePath =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development.local';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          uri: config.get('DATABASE_URL') || '',
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        limit: 100000,
        ttl: 3600000, // 1 hour
      },
    ]),
    ConfigModule.forRoot({
      envFilePath: [envFilePath],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => {
        return {
          pinoHttp:
            config.get('NODE_ENV') === 'development'
              ? {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                      levelFirst: true,
                      translateTime: "yyyy-mm-dd'T'HH:MM:ss.l'Z'",
                      messageFormat:
                        '{req.url} {req.headers.x-correlation-id} [{context}] {msg}',
                      ignore: 'pid,hostname,context,req,res.headers',
                      errorLikeObjectKeys: ['err', 'error'],
                    },
                  },
                }
              : {},
        };
      },
    }),
    AuthModule,
    UserModule,
    PostModule,
    BookmarkModule,
    StatsModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
