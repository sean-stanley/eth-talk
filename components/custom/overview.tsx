import { motion } from 'framer-motion';
import Link from 'next/link';

import { MessageIcon, VercelIcon } from './icons';

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center gap-4 items-center">
          <VercelIcon size={32} />
          <span>+</span>
          <MessageIcon size={32} />
        </p>
        <p>
          This is an AI chatbot built with real world capabilities to help you
          manage your smart wallet.
        </p>
        <p>
          You can learn more about cryptocurrency by visiting{' '}
          <Link
            className="font-medium underline underline-offset-4"
            href="https://www.coinbase.com/"
            target="_blank"
          >
            Coinbase
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
