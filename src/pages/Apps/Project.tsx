import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconUserPlus from '../../components/Icon/IconUserPlus';
import IconListCheck from '../../components/Icon/IconListCheck';
import IconSearch from '../../components/Icon/IconSearch';
import IconUser from '../../components/Icon/IconUser';
import IconX from '../../components/Icon/IconX';
import axios from 'axios';
import Swal from 'sweetalert2';
import apiconfig from '../../api/apiconfig.json';
// import { apiHeaders } from '../../api/helpapi';
import { useAuth } from '../../AuthContext';
import { QueryClient, useQuery } from 'react-query';
interface Project {
    project_name: string;
}
const Project = () => {
    const { token } = useAuth();

    const apiHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    };

    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Projectes'));
    });
    const [addProjectModal, setAddProjectModal] = useState<any>(false);
    const [value, setValue] = useState<any>('list');
    const [defaultParams] = useState({
        iproject_id: null,
        project_name: '',
        client_name: '',
        client_email: '',
        client_phone: '',
        total_amount: '',
        advance_ammount: '',
        assigned_person: '',
        address: '',
    });

    const [params, setParams] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));

    const changeValue = (e: any) => {
        const { value, id } = e.target;
        setParams({ ...params, [id]: value });
    };

    const [search, setSearch] = useState<any>('');
    const [projectList, setProjectList] = useState<any[]>([]);
    const [filteredItems, setFilteredItems] = useState<any[]>([]);
    const [actionTrigger, setActionTrigger] = useState(0);
    useEffect(() => {
        // Fetch data from the API
        const fetchData = async () => {
            try {
                const response = await axios.post(
                    `${apiconfig.apiroot}${apiconfig.apiendpoint.projectlist}`,
                    {/* If you have any request data, add it here */ },
                    apiHeaders
                );
                setProjectList(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [actionTrigger]); // Empty dependency array runs this effect only once on component mount

    useEffect(() => {
        // Filter the project list based on the search query
        const filtered = projectList.filter(
            (item: Project) =>
                item.project_name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredItems(filtered);
    }, [search, projectList]);

    const saveUser = async () => {

        try {
            if (params.project_id) {
                // Update user
                let user = filteredItems.find((d) => d.project_id === params.project_id);
                user.project_name = params.project_name;
                user.client_phone = params.client_phone;
                user.total_amount = params.total_amount;
                user.advance_ammount = params.advance_ammount;
                user.assigned_person = params.assigned_person;
                // user.address = params.address;
                user.client_name = null || params.client_name;
                user.client_email = params.client_email;

                await axios.put(`${apiconfig.apiroot}${apiconfig.apiendpoint.updateproject}/${params.project_id}`, user, apiHeaders);

                showMessage('User has been updated successfully.');
                setActionTrigger(prev => prev + 1);
            } else {
                // Add user
                let maxUserId = filteredItems.length ? Math.max(...filteredItems.map(item => item.project_id)) : 0;

                let user = {
                    project_id: maxUserId + 1,
                    project_name: params.project_name,
                    client_phone: params.client_phone,
                    total_amount: params.total_amount,
                    advance_ammount: params.advance_ammount,
                    assigned_person: params.assigned_person,
                    // address: params.address,
                    client_name: params.client_name,
                    client_email: params.client_email
                };



                await axios.post(`${apiconfig.apiroot}${apiconfig.apiendpoint.addproject}`, user, apiHeaders);

                showMessage('User has been added successfully.');
                setActionTrigger(prev => prev + 1);
                filteredItems.splice(0, 0, user);
            }

            setAddProjectModal(false);
        } catch (error) {
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
            // Omitting client_name field from user object
            const { ...userWithoutclient_name } = user;
            let json1 = JSON.parse(JSON.stringify(userWithoutclient_name));
            setParams(user);
        }
        setAddProjectModal(true);
    };

    const deleteUser = async (user: any | null = null): Promise<void> => {
        if (!user || !user.project_id) {
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
                const response = await axios.delete(`${apiconfig.apiroot}${apiconfig.apiendpoint.deleteproject}/${user.project_id}`, apiHeaders);

                if (response.status === 200) {
                    setFilteredItems(prevItems => prevItems.filter((d: any) => d.project_id !== user.project_id));
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

    const [assignProjectModal, setAssignProjectModal] = useState<any>(false);
    const [adddevelopersModel, setAdddevelopersModel] = useState<any>(false);
    const [projectdata, setProjectdata] = useState<any>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [assignlist, setAssignlist] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [developerList, setDeveloperList] = useState([]);
    const fetchAssignList = async (userid: any = null) => {
        try {
            setIsLoading(true);

            const response = await axios.post(`${apiconfig.apiroot}${apiconfig.apiendpoint.listassignidbyproject}/${userid}`,
                {/* If you have any request data, add it here */ },
                apiHeaders,
            );

            const data = response.data;
            setAssignlist(data);
            setIsLoading(false);
            setAssignProjectModal(true);
        } catch (error) {
            console.error('Error fetching assign list:', error);
            setError('Failed to fetch assign list data');
            setIsLoading(false);
        }
    };



    const fetchdeveloperData = async () => {
        try {
            const response = await axios.post(
                `${apiconfig.apiroot}${apiconfig.apiendpoint.listemploy}`,
                {/* If you have any request data, add it here */ },
                apiHeaders
            );
            setDeveloperList(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    // const [paramsproject, setParamsproject] = useState<any>(JSON.parse(JSON.stringify(defaultParams)));
    const assignProject = async (project: any = null) => {

        try {
            if (project) {
                await fetchAssignList(project!.project_id);
                setProjectdata(project.project_id)
                console.log(projectdata)// Trigger data fetching
            }
            // setAssignProjectModal(true); // Open the modal after successful data fetching
        } catch (error) {
            console.error('Error fetching assign list:', error);
        }
    };
    const [defaultParamsproject] = useState({
        project_id: '',
        user_id: '',
        total_payment: '',
        advance_payment: ''
    });
    const [paramsproject, setParamsproject] = useState<any>(JSON.parse(JSON.stringify(defaultParamsproject)));
    const changeValueproject = (e: any) => {
        const { value, id } = e.target;
        setParamsproject({ ...paramsproject, [id]: value });
    };
    const adddevelopers = (project: any = null) => {

        fetchdeveloperData();
        if (project.assignment_id) {

            setParamsproject(project);
        } else {
            setActionTrigger(prev => prev + 1);
            const json = JSON.parse(JSON.stringify(defaultParamsproject));
            setParamsproject({
                ...json, // Spread the defaultParamsproject
                project_id: project // Update only the project_id field
            });
        }
        setAdddevelopersModel(true)
    }

    const saveandadddevelopers = async () => {
        if (paramsproject.assignment_id) {
            try {
                const response = await axios.post(`${apiconfig.apiroot}${apiconfig.apiendpoint.updateassignidbyproject}/${paramsproject.assignment_id}`, paramsproject,
                    apiHeaders
                );

                console.log('Project and developers saved successfully');
                showMessage('Developer has been Assign successfully.');
                await fetchAssignList(projectdata);
                setAdddevelopersModel(false);
            } catch (error) {
                console.error('Error saving project and developers:', error);
            }
        } else {
            try {
                const response = await axios.post(`${apiconfig.apiroot}${apiconfig.apiendpoint.addassignidbyproject}`, paramsproject,
                    apiHeaders,
                );

                console.log('Project and developers saved successfully');
                showMessage('Developer has been Assign successfully.');
                await fetchAssignList(projectdata);
                setAdddevelopersModel(false);
            } catch (error) {
                console.error('Error saving project and developers:', error);
            }
        }
    };

    const deleteassigndeveloper = async (user: any | null = null): Promise<void> => {
        if (!user || !user.project_id) {
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
                const response = await axios.delete(`${apiconfig.apiroot}${apiconfig.apiendpoint.deleteassignidbyproject}/${user.assignment_id}`,
                    apiHeaders,
                );

                if (response.status === 200) {
                    // Assuming setFilteredItems is a state setter function
                    setFilteredItems(prevItems => prevItems.filter(d => d.assignment_id !== user.assignment_id));
                    Swal.fire('Success', 'User has been deleted successfully.', 'success');
                    await fetchAssignList(projectdata);
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

    console.log(developerList)
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
                <h2 className="text-xl">Projectes</h2>
                <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                    <div className="flex gap-3">
                        <div>
                            <button type="button" className="btn btn-primary" onClick={() => editUser()}>
                                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                                Add Project
                            </button>
                        </div>
                        <div>
                            <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                                <IconListCheck />
                            </button>
                        </div>

                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Search Projectes" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                    <th>Project Name</th>
                                    <th>Client Name</th>
                                    {/* <th>Client Email</th> */}
                                    {/* <th>Client Phone</th> */}
                                    <th>Total Amount</th>
                                    <th>Advance Payment</th>
                                    <th>Due Payment</th>
                                    <th>Assigned Person</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((project: any) => {
                                    return (
                                        <tr key={project.project_id}>
                                            <td>
                                                <div className="flex items-center w-max">
                                                    {project.path && (
                                                        <div className="w-max">
                                                            <img src={`/assets/images/${project.path}`} className="h-8 w-8 rounded-full object-cover ltr:mr-2 rtl:ml-2" alt="avatar" />
                                                        </div>
                                                    )}
                                                    {!project.path && project.project_name && (
                                                        <div className="grid place-content-center h-8 w-8 ltr:mr-2 rtl:ml-2 rounded-full bg-primary text-white text-sm font-semibold">
                                                            {project.project_name.charAt(0).toString()}
                                                        </div>
                                                    )}
                                                    {!project.path && !project.project_name && (
                                                        <div className="border border-gray-300 dark:border-gray-800 rounded-full p-2 ltr:mr-2 rtl:ml-2">
                                                            <IconUser className="w-4.5 h-4.5" />
                                                        </div>
                                                    )}
                                                    <div>{project.project_name}</div>
                                                </div>
                                            </td>
                                            <td>{project.client_name}</td>
                                            {/* <td className="whitespace-nowrap">{project.client_email}</td> */}
                                            {/* <td className="whitespace-nowrap">{project.client_phone}</td> */}
                                            <td className="whitespace-nowrap"><span style={{ background: 'yellow', borderRadius: '10px', color: 'black', padding: '5px' }}>{project.total_amount}</span></td>
                                            <td className="whitespace-nowrap"><span style={{ background: 'green', borderRadius: '10px', color: 'white', padding: '5px' }}>{project.advance_ammount}</span></td>
                                            <td className="whitespace-nowrap"><span style={{ background: 'red', borderRadius: '10px', color: 'white', padding: '5px' }}>{project.total_amount - project.advance_ammount}</span></td>
                                            {/* <td className="whitespace-nowrap">{project.assigned_person}</td> */}
                                            {/* <td className="whitespace-nowrap">{project.advance_ammount	}</td> */}
                                            <td>
                                            <div className="flex gap-4 items-center justify-center">
                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => assignProject(project)}>
                                                Assigned
                                            </button>
                                            </div>
                                            </td>

                                            <td>
                                                <div className="flex gap-4 items-center justify-center">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => editUser(project)}>
                                                        Edit
                                                    </button>
                                                    {project?.client_email === "Master_Admin" ? '' :
                                                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteUser(project)}>
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


            <Transition appear show={addProjectModal} as={Fragment}>
                <Dialog as="div" open={addProjectModal} onClose={() => setAddProjectModal(false)} className="relative z-[51]">
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
                                        onClick={() => setAddProjectModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {params.project_id ? 'Edit Project' : 'Add Project'}
                                    </div>
                                    <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                <label htmlFor="project_name">project_name</label>
                                                <input id="project_name" type="text" placeholder="Enter project_name" className="form-input" value={params.project_name} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="client_name">client_name</label>
                                                <input id="client_name" type="text" placeholder="Enter client_name" value={params.client_name} className="form-input" onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="client_email">client_email</label>
                                                <input id="client_email" type="email" placeholder="client_email" className="form-input" value={params.client_email} onChange={(e) => changeValue(e)} />

                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="client_phone">client_phone</label>
                                                <input id="client_phone" type="number" placeholder="client_phone" className="form-input" value={params.client_phone} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="total_amount">total_amount</label>
                                                <input id="total_amount" type="text" placeholder="Enter total_amount" className="form-input" value={params.total_amount} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="advance_ammount	">advance_ammount	</label>
                                                <input id="advance_ammount" type="text" placeholder="Enter advance_ammount	" className="form-input" value={params.advance_ammount} onChange={(e) => changeValue(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="assigned_person">assigned_person</label>
                                                <input id="assigned_person" type="text" placeholder="Enter assigned_person" className="form-input" value={params.assigned_person} onChange={(e) => changeValue(e)} />
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAddProjectModal(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveUser}>
                                                    {params.project_id ? 'Update' : 'Add'}
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
            <Transition appear show={assignProjectModal} as={Fragment}>
                <Dialog as="div" open={assignProjectModal} onClose={() => setAddProjectModal(false)} className="relative z-[51]">
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
                                <Dialog.Panel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setAssignProjectModal(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {paramsproject.project_id ? ' Edit Assigned Project' : ' Add Assigned developer'}
                                    </div>
                                    <div className='flex flex-wrap '>
                                        <div className='w-1/2'>

                                        </div>
                                        <div className='w-1/2 text-end p-4'>
                                            <button type="button" className="inline-block align-middle text-center select-none border font-normal whitespace-no-wrap rounded  no-underline py-1 px-2 leading-tight text-xs  text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white bg-white hover:bg-blue-600" onClick={() => adddevelopers(projectdata)}>
                                                Add Developer
                                            </button>
                                        </div>
                                    </div>
                                    {!adddevelopersModel && <>
                                        <div className='mx-5 my-2'>
                                            {isLoading && <p>Loading...</p>}
                                            {error && <p>data not sound</p>}
                                            {assignlist && (
                                                <div>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                {/* <th>Project</th> */}
                                                                <th>Developers</th>
                                                                <th>Advance Payment</th>
                                                                <th>Total Payment</th>
                                                                <th>Due Payment</th>
                                                                <th className="!text-center">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {assignlist.map((item: any) => (
                                                                <tr key={item.id}>
                                                                    {/* <td>{item.project}</td> */}
                                                                    <td>{item.username}</td>
                                                                    <td>{item.advance_payment}</td>
                                                                    <td>{item.total_payment}</td>
                                                                    <td>{item.total_payment - item.advance_payment}</td>
                                                                    <td>
                                                                        <div className="flex gap-4 items-center justify-center">
                                                                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => adddevelopers(item)}>
                                                                                Edit
                                                                            </button>

                                                                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteassigndeveloper(item)}>
                                                                                Delete
                                                                            </button>


                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </>}
                                    {adddevelopersModel && <div className="p-5">
                                        <form>
                                            <div className="mb-5">
                                                {/* <label htmlFor="project_name">project_name</label> */}
                                                <input id="project_id " type="text" placeholder="Enter project_name" className="form-input" value={paramsproject.project_id} onChange={(e) => changeValueproject(e)} />
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="user_id">Assign Project</label>
                                                <select id="user_id" className="form-select" onChange={(e) => changeValueproject(e)} >
                                                    <option value="">Select a developer</option>
                                                    {developerList.map((developer :any) => (
                                                        <option key={developer.id} value={developer.id} selected={paramsproject.user_id === developer.id}>
                                                            {developer.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="total_payment">Total Ammount</label>
                                                <input id="total_payment" type="number" placeholder="client_email" className="form-input" value={paramsproject.total_payment} onChange={(e) => changeValueproject(e)} />

                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="advance_payment">Advance Ammount</label>
                                                <input id="advance_payment" type="number" placeholder="client_phone" className="form-input" value={paramsproject.advance_payment} onChange={(e) => changeValueproject(e)} />
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setAdddevelopersModel(false)}>
                                                    Cancel
                                                </button>
                                                <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={saveandadddevelopers}>
                                                    {paramsproject.assignment_id ? 'Update' : 'Add'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>}

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default Project;
