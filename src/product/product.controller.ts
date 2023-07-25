import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Roles } from 'src/decoratores/role.decorator';
import { createProductDto } from './dto/product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get(':storeId/findall')
  async getAllProducts(@Param('storeId', new ParseUUIDPipe()) storeId: string) {
    return await this.productService.getAllProducts(storeId);
  }
  @Get(':id')
  async getProductById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.productService.getProductById(id);
  }
  @Roles('ADMIN')
  @Post(':storeId/create')
  async createProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Body() body: createProductDto,
  ) {
    return await this.productService.createProduct(body, storeId);
  }
  @Roles('ADMIN')
  @Delete(':id')
  async deleteProduct(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.productService.deleteProductById(id);
  }
  @Roles('ADMIN')
  @Patch(':storeId/update/:id')
  async updateProduct(
    @Param('storeId', new ParseUUIDPipe()) storeId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: createProductDto,
  ) {
    return await this.productService.updateProductById(id, data);
  }
  @Get('')
  async searchProduct(
    @Param('query') query: string,
    @Query('page') page: number,
    @Query('perpage') perpage: number,
  ) {
    return await this.productService.searchProduct(query, page, perpage);
  }
  @Get('')
  async filterProducts(
    @Query('page') page: number,
    @Query('perPage') perPage: number,
    @Query('category') category?: { name: string },
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sizes') sizes?: { value: string },
  ) {
    const price =
      maxPrice || minPrice
        ? {
            ...(minPrice && { gte: parseInt(minPrice) }),
            ...(maxPrice && { lte: parseInt(maxPrice) }),
          }
        : undefined;
    const filters = {
      ...(category && { category }),
      ...(price && { price }),
      ...(sizes && { sizes }),
    };
    return await this.productService.filterProduct(filters, page, perPage);
  }
}
