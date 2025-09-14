/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from './county.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    private readonly cloudinaryService: CloudinaryService,

  ) {}

 async create(dto: CreateCountryDto, file?: Express.Multer.File){
    let imageUrl: string | null = null;

    if (file) {
      const result: UploadApiResponse = await this.cloudinaryService.uploadImage(
        file,
        'countries', // 📂 مجلد Cloudinary
      );
      imageUrl = result.secure_url;
    }

    const country = this.countryRepo.create({
      name: dto.name,
      image_url: imageUrl,
    });

    return await this.countryRepo.save(country);
  }

  async findAll(): Promise<Country[]> {
    return this.countryRepo.find();
  }

  async findOne(id: string): Promise<Country> {
    const country = await this.countryRepo.findOne({ where: { id } });
    if (!country) throw new NotFoundException('Country not found');
    return country;
  }

  async update(id: string, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findOne(id);
    Object.assign(country, dto);
    return this.countryRepo.save(country);
  }

  async remove(id: string): Promise<void> {
    const country = await this.findOne(id);
    await this.countryRepo.remove(country);
  }
}
