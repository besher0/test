Posts & Reactions module files.

- Post module: post.entity.ts, dto, service, controller, module
- Reaction module: reaction.entity.ts, dto, service, controller, module
- User entity snippet to add relations (replace your existing user.entity.ts or merge)
  How to integrate:

1. Copy folders `post` and `reaction` into your src/
2. Add entities to TypeOrmModule.forFeature in App modules where needed
3. Add PostModule and ReactionModule to AppModule imports
4. Ensure JwtStrategy/CurrentUser returns user object (with id)
