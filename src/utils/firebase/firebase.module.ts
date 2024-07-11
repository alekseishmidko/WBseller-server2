import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { initializeApp } from 'firebase/app';
import { FirebaseStorage, getStorage } from 'firebase/storage';
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_STORAGE',
      useFactory: (configService: ConfigService): FirebaseStorage => {
        const firebaseConfig = {
          apiKey: configService.get<string>('firebase_apiKey'),
          authDomain: configService.get<string>('firebase_authDomain'),
          projectId: configService.get<string>('firebase_projectId'),
          storageBucket: configService.get<string>('firebase_storageBucket'),
          messagingSenderId: configService.get<string>(
            'firebase_messagingSenderId',
          ),
          appId: configService.get<string>('firebase_appId'),
          measurementId: configService.get<string>('firebase_measurementId'),
        };

        const firebaseApp = initializeApp(firebaseConfig);
        return getStorage(firebaseApp);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['FIREBASE_STORAGE'],
})
export class FirebaseModule {}
