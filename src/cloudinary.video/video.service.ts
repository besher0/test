/* eslint-disable prettier/prettier */
// src/video/video.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from './VideoEntity';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class VideoService {
  constructor(@InjectRepository(Video) private repo: Repository<Video>) {}

  async createVideo(data: Partial<Video>) {
    const video = this.repo.create(data);
    return this.repo.save(video);
  }

  async getAllVideos() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async getVideosByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteVideo(id: number) {
    const video = await this.repo.findOne({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');

    if (video.publicId) {
      await cloudinary.uploader.destroy(video.publicId, {
        resource_type: 'video',
      });
    }

    return this.repo.delete(id);
  }
}
