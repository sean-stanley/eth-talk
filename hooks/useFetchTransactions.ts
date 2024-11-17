import { useEffect, useState } from 'react';

const useFetchTransactions = (address: string, filter: string) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `https://base-sepolia.blockscout.com/api/v2/addresses/${address}/transactions?filter=${filter}`,
                    {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                const data = await response.json();
                setTransactions(data.result || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [address, filter]);

    return { transactions, loading, error };
};

export default useFetchTransactions; 