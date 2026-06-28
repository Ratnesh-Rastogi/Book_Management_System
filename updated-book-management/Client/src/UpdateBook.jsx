import axios from 'axios';
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const UpdateBook = () => {
    const location = useLocation();
    const book = location.state?.book;
    const navigate = useNavigate();

    const [values, setValues] = useState({
        publisher: book?.publisher || '',
        name: book?.name || '',
        date: book?.date || '',
        cost: book?.cost ?? book?.Cost ?? ''
    });
    const [error, setError] = useState('');

    if (!book) {
        return (
            <div className='d-flex align-items-center flex-column mt-3'>
                <h2>No book selected</h2>
                <Link to='/' className='btn btn-primary'>Back to Books</Link>
            </div>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        axios.put(`http://localhost:5001/update/${book.id}`, {
            ...values,
            cost: Number(values.cost)
        })
            .then(() => {
                // update persisted localStorage copy if present
                try {
                    const stored = JSON.parse(localStorage.getItem('test_books') || '[]');
                    const idx = stored.findIndex(b => String(b.id) === String(book.id));
                    if (idx !== -1) {
                        stored[idx] = { ...stored[idx], ...values };
                        localStorage.setItem('test_books', JSON.stringify(stored));
                    }
                } catch (e) {}
                navigate('/');
            })
            .catch(err => {
                // Fallback: update localStorage and navigate
                try {
                    const stored = JSON.parse(localStorage.getItem('test_books') || '[]');
                    const idx = stored.findIndex(b => String(b.id) === String(book.id));
                    if (idx !== -1) {
                        stored[idx] = { ...stored[idx], ...values };
                        localStorage.setItem('test_books', JSON.stringify(stored));
                    }
                } catch (e) {}
                navigate('/');
            });
    }

    return (
        <div className='d-flex align-items-center flex-column mt-3'>
            <h2>Update Book</h2>
            <form className='wt-50' onSubmit={handleSubmit}>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3 mt-3">
                    <label htmlFor="Publisher" className="form-label">Publisher</label>
                    <input type="text"
                        className="form-control"
                        placeholder="Enter Publisher name"
                        name="publisher"
                        value={values.publisher}
                        onChange={(e) => setValues({ ...values, publisher: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="Book name" className="form-label">Book name:</label>
                    <input type="text"
                        className="form-control"
                        placeholder="Enter Book name"
                        name="name"
                        value={values.name}
                        onChange={(e) => setValues({ ...values, name: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="Publish date" className="form-label">Publish Date:</label>
                    <input type="date"
                        className="form-control"
                        name="date"
                        value={values.date}
                        onChange={(e) => setValues({ ...values, date: e.target.value })}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="cost" className="form-label">Cost:</label>
                    <input type="number"
                        className="form-control"
                        placeholder="Rupees"
                        name="cost"
                        step="0.01"
                        required
                        value={values.cost}
                        onChange={(e) => setValues({ ...values, cost: e.target.value })}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Update</button>
            </form>
        </div>
    );
}

export default UpdateBook;
