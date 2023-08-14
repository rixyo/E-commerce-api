import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { SingupDTO } from 'src/user/auth/dot/auth.dto';
import { createSizeDto } from 'src/size/dto/size.dto';
import { createColorDto } from 'src/color/dto/color.dto';
import { createBillboardDto } from 'src/billboard/dto/billboard.dto';
import { CreateCategoryDto } from 'src/category/dto/category.dto';
import { createProductDto } from 'src/product/dto/product.dto';
import { CreateReviewDto } from 'src/review/dto/review.dto';
import { CreateCheckoutDto } from 'src/checkout/dto/checkout.dto';
// delete category and billboard after deleteing product and make sure you delete all the order items before deleteing product due to foreign key
describe('App e2e', () => {
  let prisma: PrismaService;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
    await app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDatabase();
    pactum.request.setBaseUrl('http://localhost:3333');
  });
  afterAll(async () => {
    await app.close();
  });
  describe('Auth', () => {
    describe('Signup', () => {
      const dto: SingupDTO = {
        email: 'test@gmail.com',
        displayName: 'test',
        password: '1234567',
      };
      it('should throw error if body is empty', async () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should throw error if email is invalid', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: 'test' })
          .expectStatus(400);
      });
      it('should throw error if user already exists', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto.email)
          .expectStatus(400);
      });
      it('should create user if user does not exist', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
      it('should throw error if password is invalid', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: 'test@gmail.com', password: '123' })
          .expectStatus(409);
      });
      it('should throw error if body is empty', async () => {
        return pactum.spec().post('/auth/login').expectStatus(400);
      });
      it('should throw error if email is invalid', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: 'test' })
          .expectStatus(400);
      });
      it('should login user if user exists', async () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });
  describe('User', () => {
    it('should throw unauthorized error', async () => {
      return pactum.spec().get('/auth/me').expectStatus(403);
    });
    it('should return user', async () => {
      return pactum
        .spec()
        .get('/auth/me')
        .stores('userId', 'id')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('should update user', async () => {
      return pactum
        .spec()
        .patch('/auth/update')
        .withBody({ displayName: 'test2' })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        });
    });
  });
  describe('Store', () => {
    it('should throw error', async () => {
      return pactum
        .spec()
        .post('/store')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('should create store', async () => {
      return pactum
        .spec()
        .post('/store')
        .withBody({ name: 'test' })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .inspect()
        .stores('storeId', 'id')
        .expectStatus(201);
    });
    it('should return store', async () => {
      return pactum
        .spec()
        .get('/store/all')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('should return a store by id', async () => {
      return pactum
        .spec()
        .get('/store/$S{storeId}')
        .expectJsonMatch({
          id: '$S{storeId}',
          name: 'test',
          userId: '$S{userId}',
        })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .inspect()
        .expectStatus(200);
    });
    it('should update store', async () => {
      return pactum
        .spec()
        .patch('/store/$S{storeId}')
        .withBody({ name: 'test2' })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
  });
  describe('Size', () => {
    const dto: createSizeDto = {
      name: 'test',
      value: 's',
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/size/$S{storeId}/create')
        .withBody(dto)
        .expectStatus(403);
    });
    it('Should create size', async () => {
      return pactum
        .spec()
        .post('/size/$S{storeId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('sizeId', 'id')
        .expectStatus(201);
    });
    it('Should return sizes', async () => {
      return pactum
        .spec()
        .get('/size/$S{storeId}/all')
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('should return error if body is empty', async () => {
      return pactum
        .spec()
        .patch('/size/$S{sizeId}/update')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(400);
    });
    it('Should update size', async () => {
      return pactum
        .spec()
        .patch('/size/$S{sizeId}/update')
        .withBody({ name: 'test2', value: 'm' })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('Should return size by id', async () => {
      return pactum
        .spec()
        .get('/size/$S{sizeId}')
        .expectStatus(200)
        .expectJsonMatch({
          id: '$S{sizeId}',
          name: 'test2',
          storeId: '$S{storeId}',
          value: 'm',
        });
    });
    it('Should delete size', async () => {
      return pactum
        .spec()
        .delete('/size/$S{sizeId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
  });
  describe('color', () => {
    const dto: createColorDto = {
      name: 'test',
      value: 'red',
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/color/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('Should create color', async () => {
      return pactum
        .spec()
        .post('/color/$S{storeId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(201)
        .stores('colorId', 'id');
    });
    it('Should return colors', async () => {
      return pactum
        .spec()
        .get('/color/$S{storeId}/all')
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('Should update color', async () => {
      return pactum
        .spec()
        .patch('/color/$S{colorId}')
        .withBody({ name: 'test2', value: 'blue' })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('Should return color by id', async () => {
      return pactum
        .spec()
        .get('/color/$S{colorId}')
        .expectStatus(200)
        .expectJsonMatch({
          id: '$S{colorId}',
          name: 'test2',
          storeId: '$S{storeId}',
          value: 'blue',
        });
    });
    it('Should delete color', async () => {
      return pactum
        .spec()
        .delete('/color/$S{colorId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
  });
  describe('billboard', () => {
    const dto: createBillboardDto = {
      imageUrl: 'test',
      label: 'test',
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/billboard/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('Should create billboard', async () => {
      return pactum
        .spec()
        .post('/billboard/$S{storeId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('billboardId', 'id')
        .expectStatus(201);
    });
    it('Should return billboards', async () => {
      return pactum
        .spec()
        .get('/billboard/$S{storeId}/all')
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('Should update billboard', async () => {
      return pactum
        .spec()
        .patch('/billboard/$S{billboardId}/update')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('Should return billboard by id', async () => {
      return pactum
        .spec()
        .get('/billboard/$S{billboardId}')
        .expectStatus(200)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectJsonMatch({
          id: '$S{billboardId}',
          label: 'test',
          imageUrl: 'test',
        });
    });
  });
  describe('category', () => {
    const dto: CreateCategoryDto = {
      name: 'test',
      billboardId: '$S{billboardId}',
      gender: 'Female',
      imageUrl: 'test',
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/category/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('Should create category', async () => {
      return pactum
        .spec()
        .post('/category/$S{storeId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('categoryId', 'id')
        .expectStatus(201);
    });
    it('Should return categories', async () => {
      return pactum
        .spec()
        .get('/category/$S{storeId}/all')
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('Should update category', async () => {
      return pactum
        .spec()
        .patch('/category/$S{categoryId}/update')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('should return category by id', async () => {
      return pactum
        .spec()
        .get('/category/$S{categoryId}')
        .expectStatus(200)
        .expectJsonMatch({
          id: '$S{categoryId}',
          name: 'test',
          gender: 'Female',
          imageUrl: 'test',
          storeId: '$S{storeId}',
          billboard: {
            id: '$S{billboardId}',
            label: 'test',
            imageUrl: 'test',
          },
        })
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        });
    });
    it('should get category by gender', async () => {
      return pactum
        .spec()
        .get('/category/$S{storeId}/client')
        .expectStatus(200)
        .expectJsonLength(1)
        .withQueryParams('gender', 'female');
    });
  });
  describe('product', () => {
    const dto: createProductDto = {
      name: 'test',
      price: '100',
      description: 'test',
      categoryId: '$S{categoryId}',
      colors: [
        {
          value: 'red',
        },
      ],
      sizes: [
        {
          value: 'm',
        },
      ],
      images: [
        {
          url: 'test',
        },
      ],
      isArchived: false,
      isFeatured: false,
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/product/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('Should create product', async () => {
      return pactum
        .spec()
        .post('/product/$S{storeId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('productId', 'id')
        .stores('createdAt', 'createdAt')
        .expectStatus(201);
    });
    it('Should return products', async () => {
      return pactum
        .spec()
        .get('/product/$S{storeId}/all')
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('Should update product', async () => {
      return pactum
        .spec()
        .patch('/product/$S{productId}/update')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
    it('should return product by id', async () => {
      return pactum.spec().get('/product/$S{productId}').expectStatus(200);
    });
  });
  describe('checkout', () => {
    const dto: CreateCheckoutDto = {
      productIds: ['$S{productId}'],
      quantity: [1],
      color: ['red'],
      size: ['m'],
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/checkout/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(404);
    });
    it('Should create checkout', async () => {
      return pactum
        .spec()
        .post('/checkout/$S{storeId}')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('checkoutId', 'id')
        .expectStatus(201);
    });
  });
  describe('order', () => {
    it('should return orders', async () => {
      return pactum
        .spec()
        .get('/order/$S{storeId}/all')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('should return pandings order', async () => {
      return pactum
        .spec()
        .get('/order/pendings')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });
  });
  describe('review', () => {
    const dto: CreateReviewDto = {
      comment: 'test',
      rating: 5,
      images: [
        {
          url: 'test',
        },
      ],
    };
    it('Should throw error', async () => {
      return pactum
        .spec()
        .post('/review/$S{storeId}/create')
        .withBody({ name: 'test' })
        .expectStatus(403);
    });
    it('Should create review', async () => {
      return pactum
        .spec()
        .post('/review/$S{productId}/create')
        .withBody(dto)
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .stores('reviewId', 'id')
        .expectStatus(201);
    });
    it('Should return reviews', async () => {
      return pactum
        .spec()
        .get('/review')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200)
        .expectJsonLength(1);
    });
    it('should get product reviews', async () => {
      return pactum
        .spec()
        .get('/review/$S{productId}')
        .withQueryParams('page', '1')
        .expectStatus(200);
    });
    it('should delete review by id', async () => {
      return pactum
        .spec()
        .delete('/review/$S{reviewId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}',
        })
        .expectStatus(200);
    });
  });
});
