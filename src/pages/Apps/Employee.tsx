import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import IconListCheck from '../../components/Icon/IconListCheck';
import IconLayoutGrid from '../../components/Icon/IconLayoutGrid';
import IconSearch from '../../components/Icon/IconSearch';
import IconUser from '../../components/Icon/IconUser';
import IconFacebook from '../../components/Icon/IconFacebook';
import IconInstagram from '../../components/Icon/IconInstagram';
import IconLinkedin from '../../components/Icon/IconLinkedin';
import IconTwitter from '../../components/Icon/IconTwitter';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiconfig from '../../api/apiconfig.json';
import { apiHeaders } from '../../api/helpapi';
import { useAuth } from '../../AuthContext';
interface Employe {
    name: string;
    // Add other properties according to your employe object
}
const Employees = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Employees'));
    });

    
    const [addEmployeModal, setAddEmployeModal] = useState<any>(false);

    const [value, setValue] = useState<any>('list');
    const [defaultParams] = useState({
        id: null,
        username:'',
        password:'',
        userType:'',
        name: '',
        email: '',
        phone_number: '',
        occupation: '',
        address: '',
    });

    const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));

    const changeValue = (e: any) => {
        const { value, id } = e.target;
        setParams({ ...params, [id]: value });
    };

    const [search, setSearch] = useState<any>('');
    const [employeList, setEmployeList] = useState<any[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [actionTrigger, setActionTrigger] = useState(0);
    useEffect(() => {
        // Fetch data from the API
        const fetchData = async () => {
            try {
                const response = await axios.post(
                    `${apiconfig.apiroot}${apiconfig.apiendpoint.listemploy}`,
                    {/* If you have any request data, add it here */},
                    apiHeaders
                ); 
                setEmployeList(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [actionTrigger]); // Empty dependency array runs this effect only once on component mount
    
    useEffect(() => {
        // Filter the employe list based on the search query
        const filtered = employeList.filter(
            (item: Employe) =>
                item.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredItems(filtered);
    }, [search, employeList]);

    const saveUser = async () => {
        if (typeof params.username !== 'string' || !params.username.trim()) {
            showMessage('Username must be a non-empty string.', 'error');
            return;
        }
        if (typeof params.password !== 'string' || !params.password.trim()) {
            showMessage('Password must be a non-empty string.', 'error');
            return;
        }
        if (typeof params.name !== 'string' || !params.name.trim()) {
            showMessage('Name must be a non-empty string.', 'error');
            return;
        }
        if (typeof params.email !== 'string' || !params.email.trim()) {
            showMessage('Email must be a non-empty string.', 'error');
            return;
        }
        if (typeof params.phone_number !== 'string' || !params.phone_number.trim()) {
            showMessage('Phone number must be a non-empty string.', 'error');
            return;
        }
        if (typeof params.occupation !== 'string' || !params.occupation.trim()) {
            showMessage('Occupation must be a non-empty string.', 'error');
            return;
        }


        try {
            if (params.id) {
                // Update user
                let user = filteredItems.find((d) => d.id === params.id);
                user.username = params.username;
                user.name = params.name;
                user.email = params.email;
                user.phoneNumber = params.phone_number;
                user.occupation = params.occupation;
                user.address = params.address;
                user.password = params.password;
                user.userType = params.userType;
    
                await axios.put(`${apiconfig.apiroot}${apiconfig.apiendpoint.updatemploy}/${params.id}`, user, apiHeaders);
    
                showMessage('User has been updated successfully.');
                setActionTrigger(prev => prev + 1);
            } else {
                // Add user
                let maxUserId = filteredItems.length ? Math.max(...filteredItems.map(item => item.id)) : 0;
    
                let user = {
                    id: maxUserId + 1,
                    username: params.username,
                    name: params.name,
                    email: params.email,
                    phoneNumber: params.phone_number,
                    occupation: params.occupation,
                    address: params.address,
                    password: params.password,
                    userType: params.userType
                };
    
                
    
                await axios.post(`${apiconfig.apiroot}${apiconfig.apiendpoint.addemploy}`, user, apiHeaders);
    
                showMessage('User has been added successfully.');
                setActionTrigger(prev => prev + 1);
                filteredItems.splice(0, 0, user);
            }
    
            setAddEmployeModal(false);
        }  catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 500) {
                try {
                    const errorData = error.response.data;
                    if (errorData && errorData.message) {
                        showMessage(`${errorData.message}`, 'error');
                    } else {
                        showMessage('Server error occurred. Please try again later.', 'error');
                        console.error('Unknown error format:', errorData);
                    }
                } catch (jsonError) {
                    showMessage('Server error occurred. Please try again later.', 'error');
                    console.error('Error parsing JSON:', jsonError);
                }
            } else {
                showMessage('Failed to save user. Please try again.', 'error');
                console.error('Error:', error);
            }
        }
    };
    
   

    const editUser = (user: any = null) => {
        setActionTrigger(prev => prev + 1);
        const json = JSON.parse(JSON.stringify(defaultParams));
        setParams(json);
        if (user) {
            let json1 = JSON.parse(JSON.stringify(user));
            setParams(json1);
        }
        setAddEmployeModal(true);
    };

    const deleteUser = async (user: any | null = null): Promise<void> => {
        if (!user || !user.id) {
            Swal.fire('Error', 'Invalid user data.', 'error');
            return;
        }

        const confirmation = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        });

        if (confirmation.isConfirmed) {
            try {
                const response = await axios.delete(`${apiconfig.apiroot}${apiconfig.apiendpoint.deletetemploy}/${user.id}`, apiHeaders);
            
                if (response.status === 200) {
                    setFilteredItems(prevItems => prevItems.filter((d: any) => d.id !== user.id));
                    Swal.fire('Success', 'User has been deleted successfully.', 'success');
                    setActionTrigger(prev => prev + 1);
                } else {
                    Swal.fire('Error', 'Failed to delete user.', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'An error occurred while deleting the user.', 'error');
                console.error('Error:', error);
            }
        } else {
            Swal.fire('Cancelled', 'User deletion cancelled.', 'info');
        }
    };


    const showMessage = (msg = '', type = 'success') => {
        const toast: any = Swal.mixin({
            toast: true,
            position: 'top',
            showConfirmButton: false,
            timer: 3000,
            customClass: { container: 'toast' },
        });
        toast.fire({
            icon: type,
            title: msg,
            padding: '10px 20px',
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl">Employees</h2>
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <div className="flex gap-3">
                        <div>
                            <button type="button" className="btn btn-primary" onClick={() => editUser()}>
                                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                                Add Employe
                            </button>
                        </div>
                        <div>
                            <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                                <IconListCheck />
                            </button>
                        </div>
                        <div>
                            <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                                <IconLayoutGrid />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Search Employees" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
            </div>
            {value === 'list' && (
                <div className="mt-5 panel p-0 border-0 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Address</th>
                                    <th>Phone Number</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((employe: any) => {
                                    return (
                                        <tr key={employe.id}>
                                            <td>
                                                <div className="flex items-center w-max">
                                                    {employe.path && (
                                                        <div className="w-max">
                                                            <img src={`/assets/images/${employe.path}`} className="h-8 w-8 rounded-full object-cover ltr:mr-2 rtl:ml-2" alt="avatar" />
                                                        </div>
                                                    )}
                                                    {!employe.path && employe.name && (
                                                        <div className="grid place-content-center h-8 w-8 ltr:mr-2 rtl:ml-2 rounded-full bg-primary text-white text-sm font-semibold">
                                                            {employe.name.charAt(0).toString()}
                                                        </div>
                                                    )}
                                                    {!employe.path && !employe.name && (
                                                        <div className="border border-gray-300 dark:border-gray-800 rounded-full p-2 ltr:mr-2 rtl:ml-2">
                                                            <IconUser className="w-4.5 h-4.5" />
                                                        </div>
                                                    )}
                                                    <div>{employe.name}</div>
                                                </div>
                                            </td>
                                            <td>{employe.email}</td>
                                            <td className="whitespace-nowrap">{employe.address}</td>
                                            <td className="whitespace-nowrap">{employe.phone_number}</td>
                                            <td>
                                                <div className="flex gap-4 items-center justify-center">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editUser(employe)}>
                                                        Edit
                                                    </button>
                                                    {employe?.user_type === "Master_Admin" ? '':
                                                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(employe)}>
                                                    Delete
                                                </button>
                                                    }
                                                    
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {value === 'grid' && (
                <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 mt-5 w-full">
                    {filteredItems.map((employe: any) => {
                        return (
                            <div className="bg-white dark:bg-[#1c232f] rounded-md overflow-hidden text-center shadow relative" key={employe.id}>
                                <div className="bg-white dark:bg-[#1c232f] rounded-md overflow-hidden text-center shadow relative">
                                    <div
                                        className="bg-white/40 rounded-t-md bg-center bg-cover p-6 pb-0 bg-"
                                        style={{
                                            backgroundImage: `url('/assets/images/notification-bg.png')`,
                                            backgroundRepeat: 'no-repeat',
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    >
                                        <img className="object-contain w-4/5 max-h-40 mx-auto" src={`/assets/images/profile-35.png`} alt="employe_image" />
                                    </div>
                                    <div className="px-6 pb-24 -mt-10 relative">
                                        <div className="shadow-md bg-white dark:bg-gray-900 rounded-md px-2 py-4">
                                            <div className="text-xl">{employe.name}</div>
                                            <div className="text-white-dark">{employe.occupation}</div>
                                            <div className="flex items-center justify-between flex-wrap mt-6 gap-3">
                                                <div className="flex-auto">
                                                    <div className="text-info">{employe.posts}</div>
                                                    <div>Posts</div>
                                                </div>
                                                <div className="flex-auto">
                                                    <div className="text-info">{employe.following}</div>
                                                    <div>Following</div>
                                                </div>
                                                <div className="flex-auto">
                                                    <div className="text-info">{employe.followers}</div>
                                                    <div>Followers</div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <ul className="flex space-x-4 rtl:space-x-reverse items-center justify-center">
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary p-0 h-7 w-7 rounded-full">
                                                            <IconFacebook />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary p-0 h-7 w-7 rounded-full">
                                                            <IconInstagram />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary p-0 h-7 w-7 rounded-full">
                                                            <IconLinkedin />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary p-0 h-7 w-7 rounded-full">
                                                            <IconTwitter />
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Email :</div>
                                                <div className="truncate text-white-dark">{employe.email}</div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Phone Number :</div>
                                                <div className="text-white-dark">{employe.phone_number}</div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Address :</div>
                                                <div className="text-white-dark">{employe.address}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex gap-4 absolute bottom-0 w-full ltr:left-0 rtl:right-0 p-6">
                                        <button type="button" className="btn btn-outline-primary w-1/2" onClick={() => editUser(employe)}>
                                            Edit
                                        </button>
                                        <button type="button" className="btn btn-outline-danger w-1/2" onClick={() => deleteUser(employe)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Transition appear show={addEmployeModal} as={Fragment}>
                <Dialog as="div" open={addEmployeModal} onClose={() => setAddEmployeModal(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setAddEmployeModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.id ? 'Edit Employe' : 'Add Employe'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="username">username</label>
                                                <input id="username" type="text" placeholder="Enter username" className="form-input" value={params.username} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="password">password</label>
                                                <input id="password" type="password" placeholder="Enter password" className="form-input" value={params.password} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="password">user type</label>
                                                <select
                                                    id="userType"
                                                    // value={params.user_type}
                                                    onChange={(e) => changeValue(e)}
                                                    className="form-input"
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="Master_Admin" selected={params.user_type  === 'Master_Admin' }>Master_admin</option>
                                                    <option value="Employ" selected={params.user_type  === 'Employ' }>Employ</option>
                                                    <option value="Client" selected={params.user_type  === 'Client' }>Client</option>
                                                    {/* Add other options as needed */}
                                                </select>
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="name">Name</label>
                                                <input id="name" type="text" placeholder="Enter Name" className="form-input" value={params.name} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="email">Email</label>
                                                <input id="email" type="email" placeholder="Enter Email" className="form-input" value={params.email} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="number">Phone Number</label>
                                                <input id="phone_number" type="text" placeholder="Enter phone_number" className="form-input" value={params.phone_number} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="occupation">Occupation</label>
                                                <input id="occupation" type="text" placeholder="Enter Occupation" className="form-input" value={params.occupation} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="address">Address</label>
                                                <textarea
                                                    id="address"
                                                    rows={3}
                                                    placeholder="Enter Address"
                                                    className="form-textarea resize-none min-h-[130px]"
                                                    value={params.address}
                                                    onChange={(e) => changeValue(e)}
                                                ></textarea>
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddEmployeModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveUser}>
                                                    {params.id ? 'Update' : 'Add'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Employees;
