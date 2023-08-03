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
  @Get('result')
  async searchProduct(
    @Query('search_query') search_query: string,
    @Query('page') page: number,
  ) {
    if (!search_query || search_query === '') return [];
    return await this.productService.searchProduct(search_query, page, 10);
  }
  @Get('')
  async filterProducts(
    @Query('page') page: number,
    @Query('category') category?: { name: string },
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('isFeatured') isFeatured?: boolean,
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
      ...(isFeatured && { isFeatured }),
    };
    return await this.productService.filterProduct(filters, page, 10);
  }
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
}
