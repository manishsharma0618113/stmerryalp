import { motion } from 'motion/react';
import { Camera, Music, BookOpen, Microscope, ShieldCheck, Trophy, Bus } from 'lucide-react';

export const Facilities = () => {
  const facilities = [
    { 
      title: "Science Lab", 
      icon: <Microscope className="w-8 h-8" />, 
      desc: "Fully equipped physics, chemistry, and biology labs with modern equipment for hands-on learning.", 
      color: "bg-blue-500",
      lightColor: "bg-blue-50"
    },
    { 
      title: "Library", 
      icon: <BookOpen className="w-8 h-8" />, 
      desc: "Over 5000 books, periodics, and digital resources in a quiet, modern environment.", 
      color: "bg-orange-500",
      lightColor: "bg-orange-50"
    },
    { 
      title: "Computer Hub", 
      icon: <ShieldCheck className="w-8 h-8" />, 
      desc: "Advanced computing facility with high-speed internet and latest software curriculum.", 
      color: "bg-green-500",
      lightColor: "bg-green-50"
    },
    { 
      title: "Sports Complex", 
      icon: <Trophy className="w-8 h-8" />, 
      desc: "Large playground with facilities for football, cricket, basketball, and indoor games.", 
      color: "bg-blue-600",
      lightColor: "bg-blue-50"
    },
    { 
      title: "Arts Room", 
      icon: <Camera className="w-8 h-8" />, 
      desc: "Dedicated creative space for painting, sculpture, and various crafts activities.", 
      color: "bg-orange-600",
      lightColor: "bg-orange-50"
    },
    { 
      title: "Music Studio", 
      icon: <Music className="w-8 h-8" />, 
      desc: "We encourage students to discover their musical abilities through vocal training, instruments, and rhythm-based activities.", 
      color: "bg-green-600",
      lightColor: "bg-green-50"
    },
    { 
      title: "Transport Facility", 
      icon: <Bus className="w-8 h-8" />, 
      desc: "A fleet of modern, GPS-enabled buses covering all major routes with trained staff ensuring student safety.", 
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50"
    },
  ];

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="section-title text-center mb-4">Our Premium <span className="text-primary-orange">Facilities</span></h1>
        <p className="text-center text-[#ffeb00] mb-16 max-w-2xl mx-auto">We provide <span className="text-[#ff4b4b]">state-of-the-art infrastructure</span> to ensure the best learning and growth environment for our students.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-3xl bg-white p-10 border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all group"
            >
              <div className={`w-16 h-16 ${f.lightColor} rounded-2xl flex items-center justify-center ${f.color.replace('bg-', 'text-')} mb-8 transform group-hover:rotate-6 transition-transform shadow-sm`}>
                {f.icon}
              </div>
              <h3 className="text-2xl font-black text-primary-blue mb-4">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">
                {f.desc}
              </p>
              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center text-primary-blue font-bold text-sm">
                Learn more 
                <motion.span 
                  animate={{ x: [0, 5, 0] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
