import { motion } from 'motion/react';

export const About = () => {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
          >
            <h1 className="section-title mb-6">Nurturing Minds <span className="text-primary-orange">Since 2008</span></h1>
            <div className="space-y-6 text-gray-700 leading-relaxed mb-8">
              <p>
                Founded in 2008, St. Merry High School was established with a vision to provide quality education and create a bright future for every child in Bishnugarh and the surrounding communities. Since its inception, the school has remained committed to nurturing young minds through knowledge, discipline, creativity, and strong moral values.
              </p>
              <p>
                At our school, education is not limited to textbooks alone. We believe in a balanced and holistic approach to learning that combines academic excellence with artistic expression, physical fitness, leadership skills, and social responsibility. Our aim is to help students grow into confident, compassionate, and responsible individuals who are prepared to face the challenges of the modern world.
              </p>
              <p>
                With dedicated teachers, a supportive learning environment, and a focus on overall personality development, we encourage every student to discover their talents and achieve their full potential. We inspire our learners to dream big, work hard, and believe in themselves, because today’s students are tomorrow’s leaders.
              </p>
              <p className="font-bold text-primary-blue border-l-4 border-primary-orange pl-4 italic bg-orange-50/50 py-4 rounded-r-2xl">
                “Empowering young minds with knowledge, values, and confidence to build a brighter tomorrow.”
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h4 className="text-4xl font-black text-primary-blue mb-1">18+</h4>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Years of Legacy</p>
              </div>
              <div className="bg-orange-50 p-6 rounded-2xl">
                <h4 className="text-4xl font-black text-primary-orange mb-1">650+</h4>
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wider">Current Students</p>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-primary-orange rounded-full opacity-10 blur-2xl animate-pulse"></div>
            <img 
              src="/src/assets/images/regenerated_image_1778563820357.jpg" 
              alt="Students" 
              className="rounded-[3rem] shadow-2xl relative z-10 w-full h-auto object-cover" 
            />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary-blue rounded-full opacity-10 blur-2xl animate-pulse"></div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card text-center group hover:bg-primary-blue transition-colors duration-500">
            <h3 className="text-2xl font-bold text-primary-blue mb-4 group-hover:text-white">Our Vision</h3>
            <p className="text-gray-600 group-hover:text-blue-100">Our vision is to inspire academic excellence, strong values, confidence, responsibility, and success while creating positive contributors to society.</p>
          </div>
          <div className="glass-card text-center group hover:bg-primary-orange transition-colors duration-500">
            <h3 className="text-2xl font-bold text-primary-orange mb-4 group-hover:text-white">Our Mission</h3>
            <p className="text-gray-600 group-hover:text-orange-100">To provide a safe, disciplined, and stimulating environment that empowers students to reach their full potential.</p>
          </div>
          <div className="glass-card text-center group hover:bg-primary-green transition-colors duration-500">
            <h3 className="text-2xl font-bold text-primary-green mb-4 group-hover:text-white">Our Values</h3>
            <p className="text-gray-600 group-hover:text-green-100">Integrity, Respect, Excellence, and Inclusivity are the pillars of our institution.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
